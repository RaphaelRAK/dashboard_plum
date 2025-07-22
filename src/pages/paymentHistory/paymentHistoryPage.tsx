import React from "react";
import { Typography, Layout } from "antd";
import { PlumPaymentTable } from "../../components/paymentHistory/plumPaymentComponent";

const { Title } = Typography;
const { Content } = Layout;

export const PaymentHistoryPage: React.FC = () => {
    return (
        <Layout style={{ background: 'transparent' }}>
            <Content>
                <Title
                    level={2}
                    style={{ 
                        marginBottom: '32px',
                        fontWeight: 600,
                        color: '#262626',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                        fontSize: '28px'
                    }}
                >
                    Gestion des Paiements
                </Title>
                <PlumPaymentTable />
            </Content>
        </Layout>
    );
};