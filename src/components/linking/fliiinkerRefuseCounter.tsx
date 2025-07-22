import { useState, useEffect } from "react";
import { subscribeToFliiinkerAbort, unsubscribeFromFliiinkerAbort } from "../../services/linkings/fliiinkeRefuseApi";
import { Linking } from "../../types/linking";
import { Card } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Statistic } from "antd";

export const FliiinkerRefuseCounter = () => {
    const [ fliiinkerRefuse, setFliiinkerRefuse ] = useState<Linking[]>([]);

    useEffect(() => {
        const channel = subscribeToFliiinkerAbort(
            setFliiinkerRefuse,
            (error) => console.error('Erreur:', error)
        );

        return () => {
            unsubscribeFromFliiinkerAbort(channel);
        };
    }, []);

    return (
        <Card style={{ alignContent: 'center' }}>
            <Statistic
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <InfoCircleOutlined />
                        <span>Nb refus plüm (Linking)</span>
                    </div>
                }
                value={fliiinkerRefuse.length}
                valueStyle={{ 
                    color: 'yellow',
                    // fontWeight: 'bold',
                    fontSize: '2.5rem',
                    textAlign: 'center'
                }}
            />
        </Card>
    );
}

