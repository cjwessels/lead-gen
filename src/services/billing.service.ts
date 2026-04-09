export const createPayfastPayment = (email: string) => {
  return {
    merchant_id: import.meta.env.VITE_PAYFAST_MERCHANT_ID,
    merchant_key: import.meta.env.VITE_PAYFAST_MERCHANT_KEY,
    return_url: import.meta.env.VITE_SUCCESS_RETURN_URL,
    cancel_url: import.meta.env.VITE_CANCEL_RETURN_URL,
    notify_url: import.meta.env.VITE_NOTIFY_URL,
    name_first: email,
    email_address: email,
    amount: "99.00",
    item_name: "SaaSiFy Leads Subscription"
  };
};