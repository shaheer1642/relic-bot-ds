import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import axios from 'axios';
import React from "react";

export default function PaypalPaymentForm() {
    const [success,setSuccess] = React.useState(false)
    return (
        <div style={{backgroundColor: '#071630', minWidth: '100vw', minHeight: '100vh', display: 'flex',justifyContent: 'center', alignItems: 'center'}}>
            <div style={{backgroundColor: 'white', padding: '20px', minWidth: '30%', borderRadius: '10px'}}>
                {success ?
                    <div style={{color: '#4bf542',fontSize: '50px'}}>
                        Your payment is successful! You will receive a receipt on Discord
                    </div>
                    :
                    <PayPalScriptProvider options={{ "client-id": 'AY9F_kRIn3_uHmsdMgIMZLUYZmjuS1_Bvx_f69nfxbiYwrXqp_6xJ8SrJOEWdJycny9KAM6eSkmH6FbG', currency: 'EUR' }}>
                        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', width: '100%', marginBottom: '20px', fontSize: '32px', fontFamily: 'times new roman', fontWeight: 'bold', color: '#0d2857'}}>
                            <div>Purchase WarframeHub Vip</div>
                            <div>€1.00</div>
                        </div>
                        <PayPalButtons
                            createOrder={(data, actions) => {
                                return actions.order.create({
                                    purchase_units: [{
                                        amount: {
                                            value: "1.00",
                                            currency_code: 'EUR'
                                        },
                                    }],
                                    application_context: {
                                      shipping_preference: 'NO_SHIPPING'
                                    }
                                });
                            }}
                            onApprove={(data, actions) => {
                                return actions.order.capture().then((details) => {
                                    axios.post('/warframehub/purchase/vip/submit', {
                                        discord_id: document.cookie.split('; ').find((row) => row.startsWith('discord_id='))?.split('=')[1],
                                        transaction: details
                                    }).then(res => {
                                        if (res.status == 200) setSuccess(true)
                                        else alert(`ERROR: server responded with code ${res.status} with message ${res.data}`)
                                    }).catch(error => {
                                        if (error.response) {
                                          // Request made and server responded
                                          alert(`ERROR: server responded with code ${error.response.status} with message ${error.response.data}`);
                                        } else if (error.request) {
                                          // The request was made but no response was received
                                          alert(error.request);
                                        } else {
                                          // Something happened in setting up the request that triggered an Error
                                          alert(`Error ${error.message}`, );
                                        }
                                    })
                                });
                            }}
                            onError={(err) => alert(err)}
                        />
                </PayPalScriptProvider>
                }
            </div>
        </div>
    );
}