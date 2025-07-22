export interface Order {
  id: string;
  createdAt: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  amount: number;
  customerId: string;
}

export const fetchAllOrderInPeriodForAnalytics = async (
  startDate: string,
  endDate: string
): Promise<Order[]> => {
  // Fonction fictive pour simuler la récupération des commandes
  // Dans un environnement réel, cela ferait un appel API
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Générer des données fictives
  const mockOrders: Order[] = [];
  
  // Générer une commande pour chaque jour dans la période
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const numberOfOrders = Math.floor(Math.random() * 10) + 1; // 1-10 commandes par jour
    
    for (let i = 0; i < numberOfOrders; i++) {
      mockOrders.push({
        id: `ord-${currentDate.toISOString().split('T')[0]}-${i}`,
        createdAt: new Date(currentDate).toISOString(),
        status: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'][
          Math.floor(Math.random() * 5)
        ] as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
        amount: Math.floor(Math.random() * 10000) / 100, // montant entre 0 et 100
        customerId: `cust-${Math.floor(Math.random() * 1000)}`,
      });
    }
    
    // Avancer d'un jour
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Simuler un délai réseau
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return mockOrders;
}; 