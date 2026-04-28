import stripe
import os

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

def create_checkout_session(user_id, user_email):
    try:
        checkout_session = stripe.checkout.Session.create(
            line_items=[
                {
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': 'TalentForge Premium',
                            'description': 'Unlimited AI Interviews + Resume Intelligence',
                        },
                        'unit_amount': 999, # $9.99
                    },
                    'quantity': 1,
                },
            ],
            mode='payment',
            success_url=os.getenv("FRONTEND_URL") + '/dashboard?success=true',
            cancel_url=os.getenv("FRONTEND_URL") + '/dashboard?canceled=true',
            customer_email=user_email,
            metadata={
                'user_id': user_id
            }
        )
        return checkout_session.url
    except Exception as e:
        print(f"Stripe Error: {e}")
        return None
