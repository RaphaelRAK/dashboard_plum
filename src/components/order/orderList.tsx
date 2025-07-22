// src/components/OrdersList.tsx
import React, { useState, useEffect } from "react";
import { List, DeleteButton } from "@refinedev/antd";
import { Table, Tag, Space, Button, Drawer, Spin, Select, Input } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { Order } from "../../types/orderTypes";
import { Customer } from "../../types/customerTypes";
import { CustomerDetails } from "../customer/customerDetails";
import { FliiinkerDetails } from "../fliiinker/fliiinkerDetails";
import { FliiinkerProfile } from "../../types/fliiinkerProfileTypes";
import { OrderService } from '../../services/order/orderApi';
import "../../styles/OrdersList.css";
import { OrderDetails } from "../../pages/order/orderDetails";
import { OrderWithBilling } from "../../types/orderWithBillingType";
import { useOrders } from '../../hooks/useOrders';

const { Option } = Select;

export const OrdersTable: React.FC = () => {
    const {
        loading,
        error,
        setSearchTerm,
        selectedStatus,
        setSelectedStatus,
        filteredOrders
    } = useOrders();

    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isOrderDrawerVisible, setIsOrderDrawerVisible] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isCustomerDrawerVisible, setIsCustomerDrawerVisible] = useState(false);
    const [selectedFliiinker, setSelectedFliiinker] = useState<FliiinkerProfile | null>(null);
    const [isFliiinkerDrawerVisible, setIsFliiinkerDrawerVisible] = useState(false);

    useEffect(() => {
        const loadOrders = async () => {
            try {
                const { data } = await OrderService.fetchOrders();
                setOrders(data);
            } catch (error) {
                console.error(error);
            }
        };
        loadOrders();
    }, []);

    // Fonction pour obtenir la couleur du statut
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

    const handleViewOrder = (order: Order) => {
        setSelectedOrder(order);
        setIsOrderDrawerVisible(true);
    };

    const handleViewCustomerDetails = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsCustomerDrawerVisible(true);
    };

    const handleViewFliiinkerDetails = (fliiinker: FliiinkerProfile) => {
        setSelectedFliiinker(fliiinker);
        setIsFliiinkerDrawerVisible(true);
    };

    if (loading) return <Spin size="large" />;
    if (error) return <div>{error}</div>;

    return (
        <>
            <div style={{ marginBottom: 16 }}>
                <Input.Search
                    placeholder="Rechercher par ID ou nom du Fliiinker"
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ width: 300, marginRight: 16 }}
                />
                <Select
                    placeholder="Filtrer par statut"
                    onChange={value => setSelectedStatus(value)}
                    allowClear
                    style={{ width: 200 }}
                >
                    <Option value="cancelled">Annulé</Option>
                    <Option value="fliiinker_on_the_way">Fliiinker en route</Option>
                    <Option value="service_started">Service commencé</Option>
                    <Option value="created">Créé</Option>
                    <Option value="service_completed">Service terminé</Option>
                    <Option value="customer_confirmed_ending">Fin confirmée par le client</Option>
                    <Option value="service_completed_before_due_date">Service terminé avant la date limite</Option>
                    <Option value="service_start_confirmed">Début de service confirmé</Option>
                    <Option value="payment_confirmed">Paiement confirmé</Option>
                    <Option value="awaiting_start">En attente de démarrage</Option>
                </Select>
            </div>

            <Table
                dataSource={filteredOrders}
                rowKey="id"
                pagination={{
                    pageSize: 10,
                    showTotal: (total) => `Total ${total} commandes`,
                    showSizeChanger: true,
                    showQuickJumper: true
                }}
            >
                {/* ID Column */}
                <Table.Column<Order>
                    title="ID"
                    dataIndex="id"
                    key="id"
                />

                {/* Created At Column */}
                <Table.Column<Order>
                    title="Créé le"
                    dataIndex="created_at"
                    key="created_at"
                    render={(text: string) => new Date(text).toLocaleDateString()}
                />

                {/* Status Column */}
                <Table.Column<Order>
                    title="Statut"
                    dataIndex="status"
                    key="status"
                    render={(status: string) => (
                        <Tag color={getStatusColor(status)} style={{ fontWeight: "bold" }}>
                            {status.replace(/_/g, " ")}
                        </Tag>
                    )}
                />

                {/* Plümers Column */}
                <Table.Column<Order>
                    title="Plümers"
                    key="plumer"
                    render={(_, record) => (
                        <Space size="middle" style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <span>
                                {/* Remplacer ceci par le nom du plumer approprié */}
                                {record.fliiinker_id || "N/A"}
                            </span>
                            <Button
                                type="primary"
                                icon={<EyeOutlined />}
                                onClick={() => {
                                    const fliiinker = record.fliiinker_profile; // Assurez-vous que les données incluent cette info
                                    if (fliiinker) {
                                        handleViewFliiinkerDetails(fliiinker);
                                    }
                                }}
                                size="small"
                            />
                        </Space>
                    )}
                />

                {/* Services Column */}
                {/* <Table.Column<Order>
                    title="Services"
                    dataIndex="services"
                    key="services"
                    render={(services: string[]) => (
                        <Space size="middle">
                            {services.map((service, index) => (
                                <Tag key={index} color="blue">
                                    {service}
                                </Tag>
                            ))}
                        </Space>
                    )}
                /> */}

                {/* Actions Column */}
                <Table.Column<Order>
                    title="Actions"
                    key="actions"
                    render={(_, record) => (
                        <Space>
                            <Button
                                type="primary"
                                icon={<EyeOutlined />}
                                onClick={() => handleViewOrder(record)}
                            />
                            <DeleteButton
                                size="small"
                                recordItemId={record.id}
                            />
                        </Space>
                    )}
                />
            </Table>

            {/* Drawer pour afficher les détails */}
            <Drawer
                title="Détails de l'Ordre"
                placement="right"
                width={500}
                onClose={() => setIsOrderDrawerVisible(false)}
                open={isOrderDrawerVisible}
            >
                {selectedOrder && (
                    <OrderDetails
                        order={selectedOrder as unknown as OrderWithBilling}
                        onClose={() => setIsOrderDrawerVisible(false)}
                    />
                )}
            </Drawer>

            {/* Drawer pour afficher les détails du client */}
            {/* <Drawer
            title="Détails du Client"
            placement="right"
            width={500}
            onClose={() => setIsCustomerDrawerVisible(false)}
            open={isCustomerDrawerVisible}
        >
            {selectedCustomer && (
                <CustomerDetails 
                    publicProfile={selectedCustomer.} // Utilisez publicProfile ici
                    onClose={() => setIsCustomerDrawerVisible(false)}
                />
            )}
        </Drawer> */}

            {/* Drawer pour afficher les détails du plumer */}
            <Drawer
                title="Détails du Fliiinker"
                placement="right"
                width={500}
                onClose={() => setIsFliiinkerDrawerVisible(false)}
                open={isFliiinkerDrawerVisible}
            >
                {selectedFliiinker && selectedFliiinker.public_profile && (
                    <FliiinkerDetails
                        fliiinkerProfile={selectedFliiinker}
                        publicProfile={selectedFliiinker.public_profile}
                        onClose={() => setIsFliiinkerDrawerVisible(false)}
                    />
                )}
            </Drawer>
        </>
    );
};
