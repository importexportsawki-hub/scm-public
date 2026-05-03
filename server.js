require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.json());
app.use(express.static('public'));

// Track colis by tracking code
app.get('/api/track/:code', async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    // Extract invoice number from code (SCM-370-NP -> 370)
    const match = code.match(/SCM-(\d+)-(PN|NP)/);
    if (!match) return res.status(404).json({ error: 'Format invalide' });
    
    const num = parseInt(match[1]);
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('invoice_number', num)
      .single();
    
    if (error || !data) return res.status(404).json({ error: 'Colis introuvable' });
    res.json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Get active departures (for future use)
app.get('/api/departs', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('departs')
      .select('*')
      .gte('date_depart', new Date().toISOString().split('T')[0])
      .order('date_depart', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch(e) {
    res.json([]);
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`SCM Public site running on port ${PORT}`));
