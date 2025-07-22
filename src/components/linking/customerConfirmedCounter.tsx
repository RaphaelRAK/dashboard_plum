import { useState } from "react";
import { useEffect } from "react";
import { subscribeToCustomerConfirmed, unsubscribeFromCustomerConfirmed } from "../../services/linkings/customerConfirmedApi";
import { Linking } from "../../types/linking";
import { Card, Statistic } from "antd";
import { CheckCircleOutlined, InfoCircleOutlined } from "@ant-design/icons";

export const CustomerConfirmedCounter = () => {
    const [ customerConfirmed, setCustomerConfirmed ] = useState<Linking[]>([]);

    useEffect(() => {
        const channel = subscribeToCustomerConfirmed(
            setCustomerConfirmed,
            (error) => console.error('Erreur:', error)
        );

        return () => {
            unsubscribeFromCustomerConfirmed(channel);
        };
    }, []);

    return (
        <Card style={{  alignContent: 'center' }}>
            <Statistic
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircleOutlined />
                        <span>Acceptations (Linking)</span>
                        
                    </div>
                }
                value={customerConfirmed.length}
                valueStyle={{ 
                    color: '#52c41a',
                    fontSize: '2.5rem',
                    textAlign: 'center'
                }}
            />
        </Card>
    )
}
