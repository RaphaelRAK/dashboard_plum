// src/components/OrdersList.tsx
import React, { useState, useEffect, useMemo } from "react";
import { List, useTable, DeleteButton } from "@refinedev/antd";
import {
  Table,
  Tag,
  Space,
  Button,
  Drawer,
  Spin,
  Select,
  Input,
  Row,
  Col,
} from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { Order } from "../../types/orderTypes";
import { Customer } from "../../types/customerTypes";
import { OrderDetails } from "./orderDetails";
import { CustomerDetails } from "../customer-list/customerDetails";
import { FliiinkerDetails } from "../../components/fliiinker/fliiinkerDetails";
import { FliiinkerProfile } from "../../types/fliiinkerProfileTypes";
import { OrderWithBilling } from "../../types/orderWithBillingType";
import { fetchFliiinkerProfiles } from "../../services/fliiinker/fliiinkerApi";
import { fetchCustomerProfiles } from "../../services/customer/customerApi";
import { fetchOrderWithBilling } from "../../services/order/orderApi";
import { useSelector } from "react-redux";
import { fetchOrderWithBillingThunk } from "../../store/slices/orderSlice";
import { RootState } from "../../store/store";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { fetchOrders } from "../../store/slices/orderSlice";

const { Option } = Select;

export const OrdersList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { orders, loading, error } = useSelector(
    (state: RootState) => state.orders,
  );
  const [selectedOrder, setSelectedOrder] = useState<OrderWithBilling | null>(
    null,
  );
  const [isOrderDrawerVisible, setIsOrderDrawerVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [isCustomerDrawerVisible, setIsCustomerDrawerVisible] = useState(false);
  const [selectedFliiinker, setSelectedFliiinker] =
    useState<FliiinkerProfile | null>(null);
  const [isFliiinkerDrawerVisible, setIsFliiinkerDrawerVisible] =
    useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [fliinkers, setFliinkers] = useState<FliiinkerProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const customerData = await fetchCustomerProfiles();
        setCustomers(customerData.map((customer: any) => ({
          ...customer,
          updated_at: customer.created_at // Utiliser created_at comme fallback pour updated_at
        })) as Customer[]);

        const fliinkerData = await fetchFliiinkerProfiles();
        setFliinkers(fliinkerData as FliiinkerProfile[]);
      } catch (error) {
        console.error(error);
      }
    };
    loadOrders();
  }, []);

  const getCustomerById = (id: string) => {
    return customers.find((customer) => customer.id === id);
  };

  const getFliinkerById = (id: string) => {
    return fliinkers.find((fliiinker) => fliiinker.id === id);
  };

  const handleViewOrder = (orderWithBilling: OrderWithBilling) => {
    setSelectedOrder(orderWithBilling);
    setIsOrderDrawerVisible(true);
  };

  const handleViewCustomerDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsCustomerDrawerVisible(true);
  };

  const handleViewFliiinkerDetails = (plumer: FliiinkerProfile) => {
    setSelectedFliiinker(plumer);
    setIsFliiinkerDrawerVisible(true);
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

  const filteredOrders = useMemo(() => {
    return Object.values(orders).filter((order) => {
      const fliiinker = getFliinkerById(order.fliiinker_id);
      const customer = getCustomerById(order.customer_id);
      const fullName = fliiinker
        ? `${fliiinker.public_profile?.first_name} ${fliiinker.public_profile?.last_name}`
        : "";

      return (
        (selectedStatus ? order.status === selectedStatus : true) &&
        (order.id.toString().includes(searchTerm) ||
          fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (customer &&
            `${customer.first_name} ${customer.last_name}`
              .toLowerCase()
              .includes(searchTerm.toLowerCase())))
      );
    });
  }, [orders, searchTerm, selectedStatus]);

  if (loading) {
    return <Spin size="large" />;
  }

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12}>
          <Input
            placeholder="Search by name, surname or order ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
        <Col xs={24} sm={12}>
          <Select
            placeholder="Filter by status"
            onChange={(value) => setSelectedStatus(value)}
            allowClear
          >
            <Option value="cancelled">Cancelled</Option>
            <Option value="fliiinker_on_the_way">Fliiinker on the way</Option>
            <Option value="service_started">Service started</Option>
            <Option value="created">Created</Option>
            <Option value="service_completed">Service completed</Option>
            <Option value="customer_confirmed_ending">
              Customer confirmed ending
            </Option>
            <Option value="service_completed_before_due_date">
              Service completed before due date
            </Option>
            <Option value="service_start_confirmed">
              Service start confirmed
            </Option>
            <Option value="payment_confirmed">Payment confirmed</Option>
            <Option value="awaiting_start">Awaiting start</Option>
          </Select>
        </Col>
      </Row>
      <List title="Orders">
        <Table
          dataSource={filteredOrders}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 12,
            showTotal: (total) => `Total ${total} orders`,
            showSizeChanger: false,
            showQuickJumper: true,
            pageSizeOptions: ["10", "12", "20", "50", "100"],
          }}
        >
          <Table.Column<Order>
            title="ID"
            dataIndex="id"
            key="id"
            render={(id: string) => (
              <a
                onClick={() => {
                  dispatch(fetchOrderWithBillingThunk(id))
                    .unwrap()
                    .then((orderWithBilling) => {
                      setSelectedOrder(orderWithBilling);
                      setIsOrderDrawerVisible(true);
                    });
                }}
              >
                {id}
              </a>
            )}
          />
          {/* <Table.Column<Order>
            title="Created At"
            dataIndex="created_at"
            key="created_at"
            render={(text: string) => new Date(text).toLocaleDateString()}
          />
          <Table.Column<Order>
            title="Start Date"
            dataIndex="start_date"
            key="start_date"
            render={(text: string) => new Date(text).toLocaleDateString()}
          />
          <Table.Column<Order>
            title="End Date"
            dataIndex="end_date"
            key="end_date"
            render={(text: string) => new Date(text).toLocaleDateString()}
          /> */}
          <Table.Column<Order>
            title="Status"
            dataIndex="status"
            key="status"
            sorter={(a, b) => a.status.localeCompare(b.status)}
            render={(status: string) => (
              <Tag
                color={getStatusColor(status)}
                style={{ fontWeight: "bold" }}
              >
                {status.replace(/_/g, " ")}
              </Tag>
            )}
          />
          <Table.Column<Order>
            title="Client"
            key="customer"
            render={(_, record) => {
              return (
                <Space
                  style={{ width: "100%", justifyContent: "space-between" }}
                >
                  <span>
                    {record.customer
                      ? `${record.customer.first_name || ""} ${record.customer.last_name || ""}`
                      : "N/A"}
                  </span>
                  <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => {
                      if (record.customer) {
                        handleViewCustomerDetails({
                          ...record.customer,
                          updated_at: record.customer.created_at
                        } as unknown as Customer);
                      }
                    }}
                  />
                </Space>
              );
            }}
          />
          <Table.Column<Order>
            title="Prestataire"
            key="fliiinker"
            render={(_, record) => {
              const fliiinker = getFliinkerById(record.fliiinker_id);
              return (
                <Space
                  style={{ width: "100%", justifyContent: "space-between" }}
                >
                  <span>
                    {fliiinker
                      ? `${fliiinker.public_profile?.first_name} ${fliiinker.public_profile?.last_name}`
                      : "N/A"}
                  </span>
                  <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewFliiinkerDetails(fliiinker!)}
                  />
                </Space>
              );
            }}
          />

          <Table.Column<Order>
            title="Durée de la prestation"
            key="duration"
            render={(_, record) => {
              if (record.start_date && record.end_date) {
                const startDate = new Date(record.start_date);
                const endDate = new Date(record.end_date);
                const durationMs = endDate.getTime() - startDate.getTime();
                const durationHours = durationMs / (1000 * 60 * 60);
                
                // Afficher avec 1 décimale si nécessaire, sinon entier
                if (durationHours % 1 === 0) {
                  return `${Math.floor(durationHours)}h`;
                } else {
                  return `${durationHours.toFixed(1)}h`;
                }
              }
              return "N/A";
            }}
          />

          <Table.Column<Order>
            title="Montant total"
            key="total_amount"
            render={(_, record) => {
              return record.billing?.total_amount
                ? `${record.billing.total_amount} €`
                : "N/A";
            }}
          />
          <Table.Column<Order>
            title="Taux horaire sans frais"
            key="hourly_rate"
            render={(_, record) => {
              return record.billing?.fliiinker_rate
                ? `${record.billing.fliiinker_rate} €`
                : "N/A";
            }}
          />
          <Table.Column<Order>
            title="Frais"
            key="fees"
            render={(_, record) => {
              return record.billing?.fees ? `${record.billing.fees} €` : "N/A";
            }}
          />
          <Table.Column<Order>
            title="Actions"
            key="actions"
            render={(_, record) => (
              <Space>
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  onClick={() => {
                    dispatch(fetchOrderWithBillingThunk(record.id))
                      .unwrap()
                      .then((orderWithBilling) => {
                        setSelectedOrder(orderWithBilling);
                        setIsOrderDrawerVisible(true);
                      });
                  }}
                />
                <DeleteButton size="small" recordItemId={record.id} />
              </Space>
            )}
          />
        </Table>
      </List>

      <Drawer
        title="Order Details"
        placement="right"
        width={500}
        onClose={() => setIsOrderDrawerVisible(false)}
        open={isOrderDrawerVisible}
      >
        {selectedOrder && (
          <OrderDetails
            order={selectedOrder}
            onClose={() => setIsOrderDrawerVisible(false)}
          />
        )}
      </Drawer>

      <Drawer
        title="Customer Details"
        placement="right"
        width={500}
        onClose={() => setIsCustomerDrawerVisible(false)}
        open={isCustomerDrawerVisible}
      >
        {selectedCustomer && (
          <CustomerDetails
            customer={selectedCustomer}
            onClose={() => setIsCustomerDrawerVisible(false)}
          />
        )}
      </Drawer>

      <Drawer
        title="Fliinker Details"
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
