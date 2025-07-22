import { useState, useEffect } from "react";
import { Order } from "../../types/orderTypes";
import { fetchOrderCancelled, subscribeToOrderCancelled, unsubscribeFromOrderCancelled } from "../../services/analytics/order/orderCancelledApi";
import { Card, Statistic, Typography } from "antd";
import { CloseCircleOutlined } from "@ant-design/icons";

const OrderCancelled: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);

    // useEffect(() => {
    //     const loadInitialData = async () => {
    //         try {
    //             console.log("Récupération initiale des commandes annulées");
    //             const initialData = await fetchOrderCancelled();
    //             setOrders(initialData);
    //         } catch (error) {
    //             console.error("Erreur lors du chargement initial:", error);
    //         }
    //     };

    //     loadInitialData();

    //     // S'abonner aux mises à jour en temps réel
    //     const channel = subscribeToOrderCancelled(
    //         (newOrder) => setOrders(prev => [...prev, newOrder]),
    //         setOrders
    //     );

    //     console.log("---------------------------------")
    //     console.log("itoooooooooooooooooooooooooooooooo", orders)
    //     console.log("---------------------------------")

    //     // Nettoyage lors du démontage du composant
    //     return () => {
    //         unsubscribeFromOrderCancelled(channel);
    //     };
    // }, []);

    useEffect(() => {
        const channel = subscribeToOrderCancelled(
            setOrders,
            (error) => console.error('Erreur:', error)
        );
    
        return () => {
            unsubscribeFromOrderCancelled(channel);
        };
    }, []);

    return (
        <Card style={{  alignContent: 'center' }}>
            <Statistic
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CloseCircleOutlined />
                        <span>Commandes annulées</span>
                    </div>
                }
                value={orders.length}
                valueStyle={{ 
                    color: '#ff4d4f',
                    fontSize: '2.5rem',
                    textAlign: 'center'
                }}
            />
        </Card>
    );
};

export default OrderCancelled;