import React, { useState, useEffect, useCallback } from "react";
import { Row, Col, Form, Input, Button, Space, Popconfirm, Select, Avatar, Typography, Card, Tag, Spin } from "antd";
import { EditOutlined, SaveOutlined, CloseOutlined, UserOutlined, LockOutlined } from "@ant-design/icons";
import { useUpdate, useDelete } from "@refinedev/core";
import { Public_profile } from "../../types/public_profileTypes";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { fetchPublicProfileById } from "../../store/slices/publicProfileSlice";

const { TextArea } = Input;
const { Title, Text } = Typography;
const supabase_url_storage_images = import.meta.env.VITE_SUPABASE_STORAGE_URL_FOR_IMAGES;

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
interface CustomerDetailsProps {
    publicProfile: Public_profile;
    onClose: () => void;
}

export const CustomerDetails: React.FC<CustomerDetailsProps> = ({ publicProfile, onClose }) => {
    const dispatch = useAppDispatch();
    const loading = useSelector((state: RootState) => state.publicProfiles.loading);
    const profileExists = useSelector((state: RootState) => 
        state.publicProfiles.profiles[publicProfile.id]
    );

    // Rafraîchir les données du profil si nécessaire
    useEffect(() => {
        if (!profileExists) {
            dispatch(fetchPublicProfileById(publicProfile.id));
        }
    }, [dispatch, publicProfile.id, profileExists]);

    const { mutate: update } = useUpdate();
    const { mutate: deleteOne } = useDelete();

    const handleUpdate = async (field: string, value: any) => {
        try {
            await update({
                resource: "public_profile",
                id: publicProfile.id,
                values: { [field]: value },
            });
            // Rafraîchir les données après la mise à jour
            dispatch(fetchPublicProfileById(publicProfile.id));
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
        }
    };

    const handleDelete = async () => {
        await deleteOne({
            resource: "public_profile",
            id: publicProfile.id,
        });
        onClose();
    };

    if (loading) return <Spin />;

    return (
        <div style={{ padding: "20px" }}>
            {/* Avatar */}
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
                {publicProfile.avatar && publicProfile.avatar.length > 0 ? (
                    <Avatar size={200} src={supabase_url_storage_images + publicProfile.avatar} style={{ border: "4px solid #f0f0f0" }} />
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
                        <Text strong>Identifier: </Text>
                        <Text>{publicProfile.id}</Text>
                    </div>

                    <div>
                        <Text strong>First Name: </Text>
                        <EditableField
                            value={publicProfile.first_name}
                            onSave={(value) => handleUpdate("first_name", value)}
                        />
                    </div>

                    <div>
                        <Text strong>Last Name: </Text>
                        <EditableField
                            value={publicProfile.last_name}
                            onSave={(value) => handleUpdate("last_name", value)}
                        />
                    </div>

                    <div>
                        <Text strong>Email: </Text>
                        <EditableField value={publicProfile.email} readOnly={true} />
                    </div>

                    <div>
                        <Text strong>Phone: </Text>
                        <EditableField
                            value={publicProfile.phone || "Not specified"}
                            onSave={(value) => handleUpdate("phone_number", value)}
                        />
                    </div>

                    <div>
                        <Text strong>Gender: </Text>
                        <EditableField
                            value={publicProfile.gender || "Not specified"}
                            onSave={(value) => handleUpdate("gender", value)}
                        />
                    </div>

                    <Space direction="vertical" style={{ width: "100%" }}>
                        <Text type="secondary">Created at: {publicProfile.created_at ? new Date(publicProfile.created_at).toLocaleDateString() : "Non spécifié"}</Text>
                        <Text type="secondary">Email confirmed at: {publicProfile.email_confirmed_at ? new Date(publicProfile.email_confirmed_at).toLocaleDateString() : "Non spécifié"}</Text>
                        <Text type="secondary">Phone confirmed at: {publicProfile.phone_confirmed_at ? new Date(publicProfile.phone_confirmed_at).toLocaleDateString() : "Non spécifié"}</Text>
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