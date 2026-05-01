// src/services/mpesa.js
const axios = require('axios');
const crypto = require('crypto');

class MpesaService {
    constructor() {
        this.consumerKey = process.env.MPESA_CONSUMER_KEY;
        this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
        this.passkey = process.env.MPESA_PASSKEY;
        this.shortcode = process.env.MPESA_SHORTCODE;
        this.baseUrl = process.env.MPESA_ENV === 'production' 
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';
    }

    async getAccessToken() {
        const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
        
        try {
            const response = await axios.get(
                `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
                {
                    headers: {
                        Authorization: `Basic ${auth}`
                    }
                }
            );
            return response.data.access_token;
        } catch (error) {
            console.error('Failed to get M-Pesa token:', error.response?.data || error.message);
            throw new Error('M-Pesa authentication failed');
        }
    }

    async stkPush(phoneNumber, amount, accountReference, transactionDesc) {
        const token = await this.getAccessToken();
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
        const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');
        
        const requestData = {
            BusinessShortCode: this.shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.round(amount),
            PartyA: phoneNumber,
            PartyB: this.shortcode,
            PhoneNumber: phoneNumber,
            CallBackURL: `${process.env.CALLBACK_URL}/api/mpesa/callback`,
            AccountReference: accountReference,
            TransactionDesc: transactionDesc
        };
        
        try {
            const response = await axios.post(
                `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
                requestData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            return {
                success: true,
                checkoutRequestID: response.data.CheckoutRequestID,
                merchantRequestID: response.data.MerchantRequestID,
                responseCode: response.data.ResponseCode,
                responseDescription: response.data.ResponseDescription
            };
        } catch (error) {
            console.error('STK Push failed:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.errorMessage || 'Payment initiation failed'
            };
        }
    }

    async queryStatus(checkoutRequestID) {
        const token = await this.getAccessToken();
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
        const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');
        
        try {
            const response = await axios.post(
                `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
                {
                    BusinessShortCode: this.shortcode,
                    Password: password,
                    Timestamp: timestamp,
                    CheckoutRequestID: checkoutRequestID
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            return {
                success: true,
                status: response.data.ResultCode === '0' ? 'completed' : 'failed',
                resultCode: response.data.ResultCode,
                resultDesc: response.data.ResultDesc
            };
        } catch (error) {
            console.error('Query failed:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.errorMessage || 'Query failed'
            };
        }
    }
}

module.exports = new MpesaService();