// A simple in-memory array to store expenses.
// NOTE: In a real-world application, this would be replaced by a database 
// (like MongoDB, PostgreSQL, or Vercel KV) as in-memory data is lost 
// between function invocations.
const expenses = [
  { 
    id: 1, 
    amount: 50.00, 
    description: "Groceries", 
    category: "Food", 
    date: new Date().toISOString() 
  },
  { 
    id: 2, 
    amount: 15.75, 
    description: "Coffee & Pastry", 
    category: "Coffee", 
    date: new Date(Date.now() - 86400000).toISOString() // Yesterday
  }
];

let nextId = 3;

/**
 * Validates the required fields for a new expense.
 * @param {object} body - The request body object.
 * @returns {string | null} - An error message or null if valid.
 */
function validateExpense(body) {
  const { amount, description, category, date } = body;

  if (amount === undefined || description === undefined || category === undefined || date === undefined) {
    return "Missing required fields: 'amount', 'description', 'category', and 'date' are required.";
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return "'amount' must be a positive number.";
  }

  if (typeof description !== 'string' || description.trim().length === 0) {
    return "'description' must be a non-empty string.";
  }
  
  if (typeof category !== 'string' || category.trim().length === 0) {
    return "'category' must be a non-empty string.";
  }

  // Basic date validation
  if (isNaN(new Date(date).getTime())) {
    return "'date' must be a valid date string (e.g., ISO 8601 format).";
  }

  return null; // Valid
}

/**
 * The main serverless function handler.
 * @param {object} req - The Vercel/Node.js request object.
 * @param {object} res - The Vercel/Node.js response object.
 */
export default function handler(req, res) {
  // Set CORS headers for local testing and cross-origin access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle pre-flight CORS requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // --- GET Handler: Fetch all expenses ---
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      data: expenses,
      count: expenses.length
    });
  }

  // --- POST Handler: Add a new expense ---
  if (req.method === 'POST') {
    const newExpense = req.body;
    
    // 1. Syntax Error Management (handled by Vercel/Node.js body parser)
    // If the body is not valid JSON, Vercel often throws an error itself 
    // or provides a `req.body` that is `undefined` or a raw buffer/string.
    if (!newExpense || Object.keys(newExpense).length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid or empty JSON body. Please ensure your Content-Type is application/json."
      });
    }

    // 2. Missing/Invalid Field Validation
    const validationError = validateExpense(newExpense);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError
      });
    }

    // 3. Success: Add the expense
    const expenseToAdd = {
      id: nextId++,
      amount: newExpense.amount,
      description: newExpense.description,
      category: newExpense.category,
      date: new Date(newExpense.date).toISOString()
    };

    expenses.push(expenseToAdd);

    return res.status(201).json({
      success: true,
      message: "Expense added successfully.",
      data: expenseToAdd
    });
  }

  // --- Default: Method Not Allowed ---
  // Handle any other HTTP methods (PUT, DELETE, etc.)
  return res.status(405).json({ 
    success: false,
    error: `Method ${req.method} Not Allowed` 
  });
}
