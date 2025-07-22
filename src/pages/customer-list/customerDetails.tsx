import React, { useState } from "react";
import { Form, Input, Button, Space, Popconfirm, Select, Avatar, Typography, Card, Tag } from "antd";
import { EditOutlined, SaveOutlined, CloseOutlined, UserOutlined, LockOutlined } from "@ant-design/icons";
import { useUpdate, useDelete } from "@refinedev/core";
import { Customer } from "../../types/customerTypes";

const { TextArea } = Input;
const { Title, Text } = Typography;

// Champ éditable générique
interface EditableFieldProps {
    value: any;
    onSave?: (value: any) => void;
    type?: "text" | "select" | "textarea" | "date";
    options?: { value: string; label: string }[];
    readOnly?: boolean;
}

const EditableField: React.FC<EditableFieldProps> = ({
    value,
    onSave,
    type = "text",
    options,
    readOnly = false,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    const handleSave = () => {
        if (onSave) {
            onSave(tempValue);
        }
        setIsEditing(false);
    };

    if (readOnly) {
        return (
            <Space>
                <Text>{value}</Text>
                <LockOutlined style={{ color: "#999" }} />
            </Space>
        );
    }

    return (
        <Space>
            {isEditing ? (
                <Space direction="vertical">
                    {type === "select" ? (
                        <Select
                            mode="tags"
                            value={tempValue}
                            onChange={setTempValue}
                            style={{ width: 300 }}
                            options={options}
                        />
                    ) : type === "textarea" ? (
                        <TextArea
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            rows={4}
                            style={{ width: 300 }}
                        />
                    ) : (
                        <Input
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            style={{ width: 300 }}
                        />
                    )}
                    <Space>
                        <Button icon={<SaveOutlined />} type="primary" onClick={handleSave} size="small" />
                        <Button icon={<CloseOutlined />} onClick={() => setIsEditing(false)} size="small" />
                    </Space>
                </Space>
            ) : (
                <Space>
                    <Text>{Array.isArray(value) ? value.join(", ") : value}</Text>
                    <Button icon={<EditOutlined />} type="text" onClick={() => setIsEditing(true)} size="small" />
                </Space>
            )}
        </Space>
    );
};

// Composant principal
interface customerDetailsProps {
    customer: Customer;
    onClose: () => void;
}

export const CustomerDetails: React.FC<customerDetailsProps> = ({ customer, onClose }) => {
    const { mutate: update } = useUpdate();
    const { mutate: deleteOne } = useDelete();

    const handleUpdate = async (field: string, value: any) => {
        await update({
            resource: "customers",
            id: customer.id,
            values: { [field]: value },
        });
    };

    const handleDelete = async () => {
        await deleteOne({
            resource: "customers",
            id: customer.id,
        });
        onClose();
    };

    return (
        <div style={{ padding: "20px" }}>
            {/* Avatar */}
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
                {customer.avatars && customer.avatars.length > 0 ? (
                    <Avatar size={200} src={customer.avatars[0]} style={{ border: "4px solid #f0f0f0" }} />
                ) : (
                    <Avatar
                        size={200}
                        icon={<UserOutlined />}
                        style={{ backgroundColor: "#1890ff", border: "4px solid #f0f0f0" }}
                    />
                )}
            </div>

            <Card bordered={false}>
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    <Title level={4}>Informations Personnelles</Title>

                    <div>
                        <Text strong>Prénom: </Text>
                        <EditableField
                            value={customer.first_name}
                            onSave={(value) => handleUpdate("first_name", value)}
                        />
                    </div>

                    <div>
                        <Text strong>Nom: </Text>
                        <EditableField
                            value={customer.last_name}
                            onSave={(value) => handleUpdate("last_name", value)}
                        />
                    </div>

                    <div>
                        <Text strong>Email: </Text>
                        <EditableField value={customer.email} readOnly={true} />
                    </div>

                    <div>
                        <Text strong>Téléphone: </Text>
                        <EditableField
                            value={customer.phone || "Non spécifié"}
                            onSave={(value) => handleUpdate("phone", value)}
                        />
                    </div>

                    <div>
                        <Text strong>Adresse: </Text>
                        <EditableField
                            value={customer.address || "Non spécifiée"}
                            onSave={(value) => handleUpdate("address", value)}
                        />
                    </div>

                    <div>
                        <Text strong>Date de naissance: </Text>
                        <EditableField
                            value={customer.date_of_birth || "Non spécifiée"}
                            onSave={(value) => handleUpdate("date_of_birth", value)}
                        />
                    </div>

                    <Space direction="vertical" style={{ width: "100%" }}>
                        <Text type="secondary">Créé le: {new Date(customer.created_at).toLocaleDateString()}</Text>
                        <Text type="secondary">
                            Dernière mise à jour: {new Date(customer.updated_at).toLocaleDateString()}
                        </Text>
                    </Space>

                    <div style={{ textAlign: "right" }}>
                        <Popconfirm
                            title="Êtes-vous sûr de vouloir supprimer cet utilisateur ?"
                            onConfirm={handleDelete}
                            okText="Oui"
                            cancelText="Non"
                        >
                            <Button danger>Supprimer</Button>
                        </Popconfirm>
                    </div>
                </Space>
            </Card>
        </div>
    );
};
