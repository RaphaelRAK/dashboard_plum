import React, { useEffect, useState } from "react";
import { Card, Typography, Tag, Button, Space, Alert, Table } from "antd";
import { Service } from "../../types/serviceTypes";
import { OrderWithBilling } from "../../types/orderWithBillingType";
import { fetchServices } from "../../services/service/serviceApi";

const { Title, Text } = Typography;

interface OrderDetailsProps {
    order: OrderWithBilling;
    onClose: () => void;
}

export const OrderDetails: React.FC<OrderDetailsProps> = ({ order, onClose }) => {
    const [services, setServices] = useState<Service[]>([]);

    useEffect(() => {
        const loadServices = async () => {
            try {
                const serviceData = await fetchServices();
                setServices(serviceData);
            } catch (error) {
                console.error(error);
            }
        };
        loadServices();
    }, []);

    const getServiceById = (id: number) => {
        return services.find((service) => Number(service.id) === id);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "created":
                return "blue";
            case "payment_confirmed":
                return "cyan";
            case "awaiting_start":
                return "orange";
            case "fliiinker_on_the_way":
                return "geekblue";
            case "service_started":
                return "purple";
            case "service_start_confirmed":
                return "gold";
            case "service_completed_before_due_date":
                return "lime";
            case "customer_confirmed_ending":
                return "green";
            case "service_completed":
                return "success";
            case "cancelled":
                return "red";
            default:
                return "default";
        }
    };

    const eventColumns = [
        {
            title: "Event",
            dataIndex: "event",
            key: "event",
        },
    ];

    const paymentEventColumns = [
        {
            title: "Payment Event",
            dataIndex: "paymentEvent",
            key: "paymentEvent",
        },
    ];

    return (
        <Card
            style={{
                borderRadius: "8px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                padding: "16px",
            }}
        >
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <Title level={4} style={{ marginBottom: "16px", color: "#595959" }}>
                    Order Details
                </Title>

                <div>
                    <Text strong>ID: </Text>
                    <Text>{order.id || "Not available"}</Text>
                </div>

                <div>
                    <Text strong>Status: </Text>
                    <Tag color={getStatusColor(order.status)}>{order.status || "Not available"}</Tag>
                </div>

                <div>
                    <Text strong>Service: </Text>
                    <Text>{getServiceById(order.service_id)?.name || "Not available"}</Text>
                </div>

                <div>
                    <Text strong>Start Date: </Text>
                    <Text>{order.start_date ? new Date(order.start_date).toLocaleString() : "Not available"}</Text>
                </div>

                <div>
                    <Text strong>End Date: </Text>
                    <Text>{order.end_date ? new Date(order.end_date).toLocaleString() : "Not available"}</Text>
                </div>

                <div>
                    <Text strong>Channel ID: </Text>
                    <Text>{order.channel_id || "Not available"}</Text>
                </div>

                <div>
                    <Text strong>Created At (Date): </Text>
                    <Text>{order.created_at ? new Date(order.created_at).toLocaleDateString() : "Not available"}</Text>
                </div>

                <div>
                    <Text strong>Created At (Time): </Text>
                    <Text>{order.created_at ? new Date(order.created_at).toLocaleTimeString() : "Not available"}</Text>
                </div>

                {order.billing ? (
                    <>
                        <div>
                            <Text strong>Billing ID: </Text>
                            <Text>{order.billing.id || "Not available"}</Text>
                        </div>
                        <div>
                            <Text strong>Total Amount: </Text>
                            <Text>{order.billing.total_amount || "Not available"} £</Text>
                        </div>
                        <div>
                            <Text strong>Fees: </Text>
                            <Text>{order.billing.fees || "Not available"} £</Text>
                        </div>
                        <div>
                            <Text strong>Payment Status: </Text>
                            <Text>{order.billing.payment_status || "Not available"}</Text>
                        </div>
                        <div>
                            <Text strong>Fliiinker Rate: </Text>
                            <Text>{order.billing.fliiinker_rate || "Not available"}</Text>
                        </div>
                    </>
                ) : (
                    <Alert
                        message="Billing information not available"
                        type="warning"
                        showIcon
                        style={{ marginBottom: "16px" }}
                    />
                )}

                <div>
                    <Text strong>Events:</Text>
                    <Table
                        dataSource={order.events?.map((event, index) => ({ key: index, event })) || []}
                        columns={eventColumns}
                        pagination={false}
                    />
                </div>

                <div>
                    <Text strong>Payment Events:</Text>
                    <Table
                        dataSource={
                            order.billing?.payment_events?.map((paymentEvent, index) => ({ key: index, paymentEvent })) ||
                            []
                        }
                        columns={paymentEventColumns}
                        pagination={false}
                    />
                </div>

                <div style={{ textAlign: "right" }}>
                    <Button type="primary" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </Space>
        </Card>
    );
};
