from flask import Flask, render_template, request, jsonify
from datetime import datetime
import json
import os

app = Flask(__name__)

# Sample pharmacy data
MEDICINES = {
    1: {'id': 1, 'name': 'Aspirin', 'price': 5.99, 'category': 'Pain Relief', 'stock': 50, 'description': 'Effective pain reliever and fever reducer'},
    2: {'id': 2, 'name': 'Ibuprofen', 'price': 7.99, 'category': 'Pain Relief', 'stock': 45, 'description': 'Anti-inflammatory pain relief medication'},
    3: {'id': 3, 'name': 'Cough Syrup', 'price': 8.99, 'category': 'Cold & Cough', 'stock': 30, 'description': 'Relieves dry and productive cough'},
    4: {'id': 4, 'name': 'Antihistamine', 'price': 6.99, 'category': 'Allergies', 'stock': 35, 'description': 'Relieves allergy symptoms'},
    5: {'id': 5, 'name': 'Vitamin C', 'price': 9.99, 'category': 'Vitamins', 'stock': 60, 'description': 'Boosts immune system'},
    6: {'id': 6, 'name': 'Antacid', 'price': 4.99, 'category': 'Digestive', 'stock': 40, 'description': 'Relieves heartburn and indigestion'},
}

CATEGORIES = ['Pain Relief', 'Cold & Cough', 'Allergies', 'Vitamins', 'Digestive']

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/medicines')
def get_medicines():
    category = request.args.get('category', None)
    if category:
        filtered = {k: v for k, v in MEDICINES.items() if v['category'] == category}
        return jsonify(list(filtered.values()))
    return jsonify(list(MEDICINES.values()))

@app.route('/api/categories')
def get_categories():
    return jsonify(CATEGORIES)

@app.route('/api/medicine/<int:medicine_id>')
def get_medicine(medicine_id):
    medicine = MEDICINES.get(medicine_id)
    if medicine:
        return jsonify(medicine)
    return jsonify({'error': 'Medicine not found'}), 404

@app.route('/api/checkout', methods=['POST'])
def checkout():
    data = request.json
    items = data.get('items', [])
    customer_name = data.get('name', 'Guest')
    customer_email = data.get('email', '')
    
    total = sum(item['price'] * item['quantity'] for item in items)
    
    # Update stock
    for item in items:
        if item['id'] in MEDICINES:
            MEDICINES[item['id']]['stock'] -= item['quantity']
    
    order = {
        'order_id': f"ORD-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        'customer_name': customer_name,
        'customer_email': customer_email,
        'items': items,
        'total': round(total, 2),
        'date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'status': 'Confirmed'
    }
    
    return jsonify(order)

@app.route('/api/search')
def search():
    query = request.args.get('q', '').lower()
    results = {k: v for k, v in MEDICINES.items() 
               if query in v['name'].lower() or query in v['description'].lower()}
    return jsonify(list(results.values()))

if __name__ == '__main__':
    app.run(debug=True, port=5000)