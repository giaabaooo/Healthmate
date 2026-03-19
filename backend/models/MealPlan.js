const mongoose = require('mongoose');

const mealPlanSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  total_calories: { 
    type: Number, 
    default: 0 
  },
  items: [{
    food_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
    name: { type: String, required: true }, 
    quantity: { type: Number, required: true },
    calories: { type: Number, required: true },
    slot: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], required: true, default: 'breakfast' } // BỔ SUNG TRƯỜNG NÀY
  }]
}, { timestamps: true });

module.exports = mongoose.model('MealPlan', mealPlanSchema);