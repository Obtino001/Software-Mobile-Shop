import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xmalyonlsdzmyfiswuvp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'
);

async function testInsert() {
  const { data, error } = await supabase
    .from('mobile_inventory')
    .insert({
      brand: 'Test',
      model: 'Test Model',
      variant: '128GB',
      storage: '128GB',
      ram: '8GB',
      color: 'Black',
      imei: '123456789012345',
      condition: 'New',
      purchase_price: 1000,
      expected_selling_price: 1500,
      purchase_source: 'Test',
      purchase_date: new Date().toISOString(),
      status: 'In Stock',
      notes: 'test',
    })
    .select('*')
    .single();

  if (error) {
    console.error('Supabase Insert Error:', error);
  } else {
    console.log('Success:', data);
  }
}

testInsert();
