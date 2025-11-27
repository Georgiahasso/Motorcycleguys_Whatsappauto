import axios from 'axios';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    // Extract phone number from request body
    const { phone } = req.body;

    // Validate that phone exists
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Normalize phone number (remove spaces, ensure it begins with +)
    let normalizedPhone = phone.trim().replace(/\s+/g, '');
    if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+' + normalizedPhone;
    }

    // Get environment variables
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
    const WHATSAPP_NUMBER_ID = process.env.WHATSAPP_NUMBER_ID;

    // Validate environment variables
    if (!WHATSAPP_TOKEN || !WHATSAPP_NUMBER_ID) {
      console.error('Missing environment variables: WHATSAPP_TOKEN or WHATSAPP_NUMBER_ID');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Prepare WhatsApp API request
    const whatsappUrl = `https://graph.facebook.com/v20.0/${WHATSAPP_NUMBER_ID}/messages`;
    
    const requestBody = {
      messaging_product: 'whatsapp',
      to: normalizedPhone,
      type: 'template',
      template: {
        name: 'quote_preparing',
        language: { code: 'en' }
      }
    };

    // Send WhatsApp message
    const response = await axios.post(whatsappUrl, requestBody, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    // Return success
    return res.status(200).json({ success: true });
  } catch (error) {
    // Log error details
    console.error('Error sending WhatsApp message:', error.response?.data || error.message || error);
    
    // Return appropriate error response
    if (error.response) {
      // API responded with error status
      return res.status(error.response.status || 500).json({ 
        error: 'Failed to send WhatsApp message',
        details: error.response.data 
      });
    } else if (error.request) {
      // Request was made but no response received
      return res.status(500).json({ error: 'No response from WhatsApp API' });
    } else {
      // Error setting up request
      return res.status(500).json({ error: 'Error processing request' });
    }
  }
}

