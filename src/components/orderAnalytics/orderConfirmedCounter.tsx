import { useEffect, useState } from "react";
import { Order } from "../../types/orderTypes";
import { fetchOrderConfirmed, subscribeToOrderConfirmed, unsubscribeFromOrderConfirmed } from "../../services/analytics/order/orderConfirmedApi";
import { CheckCircleOutlined } from "@ant-design/icons";
import { Card, Statistic } from "antd";

const OrderConfirmedCounter: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        const channel = subscribeToOrderConfirmed(
            setOrders,
            (error) => console.error('Erreur:', error)
        );
    
        return () => {
            unsubscribeFromOrderConfirmed(channel);
        };
    }, []);

    return (
        <Card style={{  alignContent: 'center' }}>
            <Statistic
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircleOutlined />
                        <span>Commandes confirmées</span>
                    </div>
                }
                value={orders.length}
                valueStyle={{ 
                    color: '#1890ff',
                    fontSize: '2.5rem',
                    textAlign: 'center'
                }}
            />
        </Card>
    );
};

export default OrderConfirmedCounter;