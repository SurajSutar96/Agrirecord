import os
import hmac
import hashlib
import razorpay

def get_razorpay_client():
    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    if not key_id or not key_secret:
        raise ValueError("Razorpay credentials are not set in environment variables")
    return razorpay.Client(auth=(key_id, key_secret))

def create_razorpay_order(amount_rupees: float, receipt: str) -> dict:
    client = get_razorpay_client()
    amount_paise = int(amount_rupees * 100)
    if amount_paise < 100:
        raise ValueError("Minimum order amount is 100 paise (₹1.00)")
        
    data = {
        "amount": amount_paise,
        "currency": "INR",
        "receipt": receipt
    }
    try:
        order = client.order.create(data=data)
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"]
        }
    except Exception as e:
        print(f"Razorpay Create Order API Exception: {e}")
        raise e

def verify_razorpay_signature(order_id: str, payment_id: str, signature: str) -> bool:
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    if not key_secret:
        return False
    msg = f"{order_id}|{payment_id}"
    generated_sig = hmac.new(
        key=key_secret.encode("utf-8"),
        msg=msg.encode("utf-8"),
        digestmod=hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(generated_sig, signature)
