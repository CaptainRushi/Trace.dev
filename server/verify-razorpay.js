
import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env from root (one level up from server folder)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('--- Razorpay Verification Script ---');
console.log('Key ID:', process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID.slice(0, 10) + '...' : 'MISSING');
console.log('Starter Plan:', process.env.RAZORPAY_PLAN_STARTER);

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('❌ Keys missing!');
    process.exit(1);
}

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

async function verify() {
    try {
        console.log('Testing authentication by fetching Starter Plan...');
        const plan = await razorpay.plans.fetch(process.env.RAZORPAY_PLAN_STARTER);
        console.log('✅ Success!');
        console.log('Plan Details:', {
            id: plan.id,
            name: plan.item.name,
            amount: plan.item.amount / 100
        });
    } catch (error) {
        console.error('❌ Failed:', error.error ? error.error.description : error.message);
        if (error.statusCode === 401) {
            console.error('👉 Check your Key ID and Secret. They might be incorrect or inactive.');
        }
        if (error.statusCode === 400 && error.error?.code === 'BAD_REQUEST_ERROR') {
            console.error('👉 Plan ID might be invalid or from a different environment (Test vs Live).');
        }
    }
}

verify();
