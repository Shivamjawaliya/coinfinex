// =====================================
// CATEGORIES — GET /categories
// =====================================
exports.categories = (req, res) => {
  const CATEGORIES = [
    { id:'technology', label:'Technology', emoji:'💻', color:'#38bdf8', description:'Software, hardware, semiconductors & cloud platforms.', stocks:[
      { sym:'AAPL', name:'Apple Inc.',       emoji:'🍎', desc:'Consumer electronics & software',    exchange:'NASDAQ', cap:'Mega Cap'  },
      { sym:'MSFT', name:'Microsoft Corp.',  emoji:'🪟', desc:'Cloud, productivity & gaming',       exchange:'NASDAQ', cap:'Mega Cap'  },
      { sym:'GOOGL',name:'Alphabet Inc.',    emoji:'🔍', desc:'Search, ads & cloud services',       exchange:'NASDAQ', cap:'Mega Cap'  },
      { sym:'NVDA', name:'NVIDIA Corp.',     emoji:'🎮', desc:'GPUs, AI chips & data centres',      exchange:'NASDAQ', cap:'Mega Cap'  },
      { sym:'META', name:'Meta Platforms',   emoji:'📘', desc:'Social media, AR/VR & digital ads',  exchange:'NASDAQ', cap:'Mega Cap'  },
      { sym:'AMD',  name:'AMD',              emoji:'⚙️', desc:'CPUs, GPUs & embedded processors',  exchange:'NASDAQ', cap:'Large Cap' },
      { sym:'IBM',  name:'IBM Corp.',        emoji:'💾', desc:'Hybrid cloud, AI & enterprise IT',   exchange:'NYSE',   cap:'Large Cap' },
    ]},
    { id:'finance', label:'Finance & Banking', emoji:'🏦', color:'#facc15', description:'Banks, investment firms, insurance & payment networks.', stocks:[
      { sym:'JPM',  name:'JPMorgan Chase',   emoji:'💳', desc:'Largest US bank by assets',          exchange:'NYSE',   cap:'Mega Cap'  },
      { sym:'BAC',  name:'Bank of America',  emoji:'🏧', desc:'Retail banking & wealth management', exchange:'NYSE',   cap:'Mega Cap'  },
      { sym:'GS',   name:'Goldman Sachs',    emoji:'📊', desc:'Investment banking & asset mgmt',    exchange:'NYSE',   cap:'Large Cap' },
      { sym:'MS',   name:'Morgan Stanley',   emoji:'📈', desc:'Wealth management & securities',     exchange:'NYSE',   cap:'Large Cap' },
      { sym:'V',    name:'Visa Inc.',        emoji:'💙', desc:'Global payments network',             exchange:'NYSE',   cap:'Mega Cap'  },
      { sym:'MA',   name:'Mastercard Inc.',  emoji:'🔴', desc:'Payment technology & processing',    exchange:'NYSE',   cap:'Mega Cap'  },
    ]},
    { id:'healthcare', label:'Healthcare & Pharma', emoji:'🏥', color:'#4ade80', description:'Pharmaceuticals, biotech, medical devices & managed care.', stocks:[
      { sym:'JNJ',  name:'Johnson & Johnson',emoji:'💊', desc:'Pharma, MedTech & consumer health',  exchange:'NYSE',   cap:'Mega Cap'  },
      { sym:'UNH',  name:'UnitedHealth',     emoji:'🩺', desc:'Managed healthcare & pharmacy',      exchange:'NYSE',   cap:'Mega Cap'  },
      { sym:'LLY',  name:'Eli Lilly',        emoji:'🔬', desc:'Diabetes, oncology & neuroscience',  exchange:'NYSE',   cap:'Mega Cap'  },
      { sym:'PFE',  name:'Pfizer Inc.',      emoji:'🧬', desc:'Global vaccines & oncology',         exchange:'NYSE',   cap:'Large Cap' },
      { sym:'MRK',  name:'Merck & Co.',      emoji:'💉', desc:'Vaccines, oncology & animal health', exchange:'NYSE',   cap:'Large Cap' },
    ]},
    { id:'consumer', label:'Consumer & Retail', emoji:'🛒', color:'#f97316', description:'E-commerce, retail chains, food & consumer brands.', stocks:[
      { sym:'AMZN', name:'Amazon.com',       emoji:'📦', desc:'E-commerce, cloud & streaming',      exchange:'NASDAQ', cap:'Mega Cap'  },
      { sym:'WMT',  name:'Walmart Inc.',     emoji:'🛒', desc:'Largest brick-and-mortar retailer',  exchange:'NYSE',   cap:'Mega Cap'  },
      { sym:'COST', name:'Costco Wholesale', emoji:'🏪', desc:'Membership warehouse clubs',         exchange:'NASDAQ', cap:'Large Cap' },
      { sym:'MCD',  name:"McDonald's",       emoji:'🍔', desc:'Global fast-food chain',             exchange:'NYSE',   cap:'Large Cap' },
      { sym:'NKE',  name:'Nike Inc.',        emoji:'👟', desc:'Athletic footwear & apparel',        exchange:'NYSE',   cap:'Large Cap' },
      { sym:'KO',   name:'Coca-Cola',        emoji:'🥤', desc:'Beverages & drink brands',           exchange:'NYSE',   cap:'Large Cap' },
    ]},
    { id:'energy', label:'Energy', emoji:'⚡', color:'#a78bfa', description:'Oil & gas, utilities and renewable energy companies.', stocks:[
      { sym:'XOM',  name:'ExxonMobil',       emoji:'🛢️', desc:'Integrated oil, gas & chemicals',   exchange:'NYSE',   cap:'Mega Cap'  },
      { sym:'CVX',  name:'Chevron Corp.',    emoji:'⛽', desc:'Exploration, production & downstream',exchange:'NYSE',  cap:'Mega Cap'  },
      { sym:'NEE',  name:'NextEra Energy',   emoji:'🌬️', desc:'Wind, solar & electric utilities',  exchange:'NYSE',   cap:'Large Cap' },
    ]},
    { id:'ev', label:'EV & Mobility', emoji:'🚗', color:'#34d399', description:'Electric vehicles, autonomous driving & mobility platforms.', stocks:[
      { sym:'TSLA', name:'Tesla Inc.',       emoji:'⚡', desc:'EV, energy storage & autonomous',    exchange:'NASDAQ', cap:'Mega Cap'  },
      { sym:'RIVN', name:'Rivian',           emoji:'🛻', desc:'Electric trucks & delivery vans',    exchange:'NASDAQ', cap:'Mid Cap'   },
      { sym:'GM',   name:'General Motors',   emoji:'🚙', desc:'Automaker transitioning to EVs',     exchange:'NYSE',   cap:'Large Cap' },
      { sym:'F',    name:'Ford Motor Co.',   emoji:'🦅', desc:'ICE & EV, F-150 Lightning',          exchange:'NYSE',   cap:'Large Cap' },
      { sym:'UBER', name:'Uber Technologies',emoji:'🚕', desc:'Ridesharing, delivery & freight',    exchange:'NYSE',   cap:'Large Cap' },
    ]},
    { id:'media', label:'Media & Entertainment', emoji:'🎬', color:'#f472b6', description:'Streaming, content studios, gaming & digital entertainment.', stocks:[
      { sym:'NFLX', name:'Netflix Inc.',     emoji:'🎬', desc:'Video streaming & content production',exchange:'NASDAQ',cap:'Large Cap' },
      { sym:'DIS',  name:'Walt Disney Co.',  emoji:'🏰', desc:'Theme parks, studios & Disney+',     exchange:'NYSE',   cap:'Large Cap' },
      { sym:'SPOT', name:'Spotify',          emoji:'🎵', desc:'Music & podcast streaming',          exchange:'NYSE',   cap:'Large Cap' },
      { sym:'EA',   name:'Electronic Arts',  emoji:'🕹️', desc:'Video game publisher',              exchange:'NASDAQ', cap:'Large Cap' },
    ]},
  ];
  res.render('categories', { user: req.user, categories: CATEGORIES });
};
