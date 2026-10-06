const defaultTemplates = [
  {
    key: 'daily-essentials',
    name: 'Daily Grocery Essentials & Fresh Routine (12 Items)',
    description: 'High-converting daily schedule from morning milk to dinner essentials and late snacks.',
    intervalMinutes: 120, // Every 2 hours
    orderMode: 'sequential',
    repeatMode: true,
    quietHours: { enabled: true, startHour: 22, endHour: 7 },
    items: [
      {
        id: 'de-1',
        title: 'Good Morning! 🌅 Morning Milk, Bread & Eggs Ready',
        body: 'Start your breakfast healthy! 15-minute express delivery to your doorstep.',
        imageUrl: '',
        targetPath: '/category/dairy-breakfast',
        tag: 'Morning'
      },
      {
        id: 'de-2',
        title: 'Crisp Farm Veggies Just Arrived! 🥦🍅',
        body: 'Direct from local farms: crunchy cucumbers, farm-fresh spinach & juicy tomatoes.',
        imageUrl: '',
        targetPath: '/category/fruits-vegetables',
        tag: 'Fresh Farm'
      },
      {
        id: 'de-3',
        title: 'Cooking Lunch Today? 🍛 Don\'t Forget The Spices!',
        body: 'Fresh ginger, garlic, mustard oil and authentic spices at best prices.',
        imageUrl: '',
        targetPath: '/products',
        tag: 'Lunch Rush'
      },
      {
        id: 'de-4',
        title: 'Afternoon Refreshment 🍉 Chilled Juices & Fresh Fruits',
        body: 'Beat the heat with chilled tender coconut water, sweet watermelons & fresh juices.',
        imageUrl: '',
        targetPath: '/category/beverages-fruits',
        tag: 'Refresh'
      },
      {
        id: 'de-5',
        title: 'Chai Time Specials! ☕ Biscuits & Crunchy Namkeen',
        body: 'Take a break with premium CTC tea, cookies, rusk and savoury snacks.',
        imageUrl: '',
        targetPath: '/category/snacks-beverages',
        tag: 'Tea Time'
      },
      {
        id: 'de-6',
        title: 'Dinner Prep Alert 🍲 Dal, Rice, Atta & Paneer',
        body: 'Order your evening kitchen essentials now before slots fill up!',
        imageUrl: '',
        targetPath: '/products',
        tag: 'Dinner'
      },
      {
        id: 'de-7',
        title: 'Sweet Cravings? 🍫 Chocolates & Ice Creams Tonight',
        body: 'Treat yourself and family with desserts, wafers and ice creams in minutes.',
        imageUrl: '',
        targetPath: '/category/desserts-sweets',
        tag: 'Treats'
      },
      {
        id: 'de-8',
        title: 'Pre-book Tomorrow Morning\'s Slot ⏰ Never Run Out of Essentials',
        body: 'Select your preferred morning slot tonight. Fresh milk will be at your door early.',
        imageUrl: '',
        targetPath: '/cart',
        tag: 'Slot Reminder'
      },
      {
        id: 'de-9',
        title: 'Household Cleaning & Essentials 🧼 Refill Today',
        body: 'Detergents, dishwash, floor cleaners and tissues at bundle discount rates.',
        imageUrl: '',
        targetPath: '/category/household-cleaning',
        tag: 'Home Care'
      },
      {
        id: 'de-10',
        title: 'Instant 2-Minute Noodles & Quick Bites 🍜',
        body: 'Hungry between work calls? Maggi, pasta, soups & instant mixes delivered fast.',
        imageUrl: '',
        targetPath: '/category/instant-food',
        tag: 'Quick Bite'
      },
      {
        id: 'de-11',
        title: 'Personal Care & Hygiene Essentials 🧴',
        body: 'Soaps, shampoos, toothpastes and daily skincare from top trusted brands.',
        imageUrl: '',
        targetPath: '/category/personal-care',
        tag: 'Personal Care'
      },
      {
        id: 'de-12',
        title: 'Check Today\'s Exclusive Deals & Discounts 🏷️',
        body: 'Up to 35% off on staples, oils & pulses. Tap to explore today\'s hot offers!',
        imageUrl: '',
        targetPath: '/products',
        tag: 'Deals'
      }
    ]
  },
  {
    key: 'weekend-deals',
    name: 'Weekend Flash Sale & Family Feast (10 Items)',
    description: 'Energetic promotional drip for Saturdays and Sundays to maximize orders and order value.',
    intervalMinutes: 180, // Every 3 hours
    orderMode: 'sequential',
    repeatMode: true,
    quietHours: { enabled: true, startHour: 22, endHour: 7 },
    items: [
      {
        id: 'wd-1',
        title: 'WEEKEND SALE IS LIVE! ⚡ Big Grocery Savings',
        body: 'Stock up your pantry this weekend with incredible discounts on all categories.',
        imageUrl: '',
        targetPath: '/products',
        tag: 'Flash Sale'
      },
      {
        id: 'wd-2',
        title: 'Sunday Special Feast 🍗 Biryani & Curry Ingredients',
        body: 'Basmati rice, whole spices, pure ghee & fresh ingredients for a grand weekend lunch.',
        imageUrl: '',
        targetPath: '/products',
        tag: 'Weekend Feast'
      },
      {
        id: 'wd-3',
        title: 'Weekend BOGO & Combo Deals 🎁 More For Less',
        body: 'Buy combo grocery packs and save up to ₹250 on your family basket.',
        imageUrl: '',
        targetPath: '/products',
        tag: 'Combos'
      },
      {
        id: 'wd-4',
        title: 'Cold Drinks, Sodas & Party Snacks 🥤🍕',
        body: 'Friends or family coming over? Get chips, party sodas & dips in 15 mins.',
        imageUrl: '',
        targetPath: '/category/beverages-snacks',
        tag: 'Party Pack'
      },
      {
        id: 'wd-5',
        title: 'Fresh Exotic Fruits 🍎 Kiwi, Dragon Fruit & Pears',
        body: 'Upgrade your fruit bowl with handpicked premium fresh fruits today.',
        imageUrl: '',
        targetPath: '/category/fruits',
        tag: 'Fresh Fruits'
      },
      {
        id: 'wd-6',
        title: 'Use Your RG Coins For Instant Cart Discounts! 🪙',
        body: 'You have reward coins in your wallet! Redeem them now on your weekend order.',
        imageUrl: '',
        targetPath: '/cart',
        tag: 'Rewards'
      },
      {
        id: 'wd-7',
        title: 'Zero Delivery Fee On Orders Above ₹299! 🚚',
        body: 'Fast doorstep delivery with guaranteed freshness. Fill your cart now!',
        imageUrl: '',
        targetPath: '/products',
        tag: 'Free Delivery'
      },
      {
        id: 'wd-8',
        title: 'Fresh Paneer, Curd & Butter 🧈 Weekend Special Stock',
        body: 'Soft, creamy and super fresh dairy delivered chilled to your doorstep.',
        imageUrl: '',
        targetPath: '/category/dairy',
        tag: 'Dairy Fresh'
      },
      {
        id: 'wd-9',
        title: 'Movie Night Popcorn & Munchies 🍿🎬',
        body: 'Sit back, relax and stream! Popcorn, nachos, salsa & colas delivered fast.',
        imageUrl: '',
        targetPath: '/category/snacks',
        tag: 'Movie Night'
      },
      {
        id: 'wd-10',
        title: 'Last Few Hours of Weekend Discounts! ⏳ Don\'t Miss Out',
        body: 'Grab your favourite items before sale pricing ends tonight!',
        imageUrl: '',
        targetPath: '/products',
        tag: 'Last Chance'
      }
    ]
  }
];

module.exports = { defaultTemplates };
