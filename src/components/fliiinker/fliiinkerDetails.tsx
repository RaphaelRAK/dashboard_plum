import React, { useState, useEffect } from "react";
import { Form, Input, Button, Popconfirm, Select, Avatar, Typography, Card, Tag } from "antd";
import { EditOutlined, SaveOutlined, CloseOutlined, UserOutlined, LockOutlined } from "@ant-design/icons";
import { useUpdate, useDelete } from "@refinedev/core";
import { Public_profile } from "../../types/public_profileTypes";
import { FliiinkerProfile } from "../../types/fliiinkerProfileTypes";
import { useAppDispatch } from "../../hooks/useAppDispatch";

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
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Text>{Array.isArray(value) ? value.join(", ") : value}</Text>
                <LockOutlined style={{ color: "#999", marginLeft: '8px' }} />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                            type={type === "date" ? "date" : "text"}
                        />
                    )}
                    <div style={{ marginTop: '8px' }}>
                        <Button
                            icon={<SaveOutlined />}
                            type="primary"
                            onClick={handleSave}
                            size="small"
                            style={{ marginRight: '8px' }}
                        />
                        <Button
                            icon={<CloseOutlined />}
                            onClick={() => setIsEditing(false)}
                            size="small"
                        />
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Text>{Array.isArray(value) ? value.join(", ") : value}</Text>
                    {!readOnly && (
                        <Button
                            icon={<EditOutlined />}
                            type="text"
                            onClick={() => setIsEditing(true)}
                            size="small"
                            style={{ marginLeft: '8px' }}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

// Composant principal
interface FliiinkerDetailsProps {
    publicProfile: Public_profile;
    fliiinkerProfile?: FliiinkerProfile | null;
    onClose: () => void;
}

export const FliiinkerDetails: React.FC<FliiinkerDetailsProps> = ({ publicProfile, onClose }) => {
    const dispatch = useAppDispatch();
    const { mutate: update } = useUpdate();
    const { mutate: deleteOne } = useDelete();

    const handleUpdate = async (field: string, value: any) => {
        await update({
            resource: "public_profile",
            id: publicProfile.id,
            values: { [field]: value },
        });
    };

    const handleDelete = async () => {
        await deleteOne({
            resource: "public_profile",
            id: publicProfile.id,
        });
        onClose();
    };

    return (
        <div style={{ padding: "20px" }}>
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
                {publicProfile.avatar ? (
                    <Avatar
                        size={200}
                        src={`${supabase_url_storage_images}${publicProfile.avatar}`}
                        style={{ border: "4px solid #f0f0f0" }}
                    />
                ) : (
                    <Avatar size={200} icon={<UserOutlined />} style={{ backgroundColor: "#1890ff" }} />
                )}
            </div>

            <Card bordered={false}>
                <Title level={4}>Informations Personnelles</Title>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                        <tr>
                            <td style={tableCellStyle}><Text strong>Identifier:</Text></td>
                            <td style={tableCellStyle}><Text>{publicProfile.id}</Text></td>
                        </tr>
                        <tr>
                            <td style={tableCellStyle}><Text strong>First Name:</Text></td>
                            <td style={tableCellStyle}>
                                <EditableField
                                    value={publicProfile.first_name}
                                    onSave={(value) => handleUpdate("first_name", value)}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td style={tableCellStyle}><Text strong>Last Name:</Text></td>
                            <td style={tableCellStyle}>
                                <EditableField
                                    value={publicProfile.last_name}
                                    onSave={(value) => handleUpdate("last_name", value)}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td style={tableCellStyle}><Text strong>Email:</Text></td>
                            <td style={tableCellStyle}>
                                <EditableField value={publicProfile.email} readOnly={true} />
                            </td>
                        </tr>
                        <tr>
                            <td style={tableCellStyle}><Text strong>Phone:</Text></td>
                            <td style={tableCellStyle}>
                                <EditableField
                                    value={publicProfile.phone || "Not specified"}
                                    onSave={(value) => handleUpdate("phone", value)}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td style={tableCellStyle}><Text strong>Date de naissance:</Text></td>
                            <td style={tableCellStyle}>
                                <Text>{publicProfile.birthday || "Not specified"}</Text>
                            </td>
                        </tr>
                        <tr>
                            <td style={tableCellStyle}><Text strong>Gender:</Text></td>
                            <td style={tableCellStyle}>
                                <EditableField
                                    value={publicProfile.gender || "Not specified"}
                                    onSave={(value) => handleUpdate("gender", value)}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td style={tableCellStyle}><Text strong>Created on:</Text></td>
                            <td style={tableCellStyle}>
                                <Text type="secondary">{new Date(publicProfile.created_at).toLocaleDateString()}</Text>
                            </td>
                        </tr>
                        <tr>
                            <td style={tableCellStyle}><Text strong>Status:</Text></td>
                            <td style={tableCellStyle}>
                                <EditableField
                                    value={publicProfile.fliiinker_profile?.status || "Not specified"}
                                    onSave={(value) => handleUpdate("status", value)}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td style={tableCellStyle}><Text strong>Status config:</Text></td>
                            <td style={tableCellStyle}>
                                <Text>{publicProfile.fliiinker_profile?.status_config || "Not specified"}</Text>
                            </td>
                        </tr>
                        {/* <tr>
                            <td style={tableCellStyle}><Text strong>Avatar:</Text></td>
                            <td style={tableCellStyle}>
                                {publicProfile.fliiinker_profile?.avatar ? (
                                    <img
                                        src={`${supabase_url_storage_images}${publicProfile.fliiinker_profile?.avatar}`}
                                        alt="Avatar"
                                        style={{ width: '50px', height: '50px', borderRadius: '50%' }}
                                    />
                                ) : (
                                    <Text>No Avatar</Text>
                                )}
                            </td>
                        </tr> */}
                        <tr>
                            <td style={tableCellStyle}><Text strong>Is Pro:</Text></td>
                            <td style={tableCellStyle}>
                                <Text>{publicProfile.fliiinker_profile?.is_pro || "Not specified"}</Text>
                            </td>
                        </tr>
                        <tr>
                            <td style={tableCellStyle}><Text strong>Description:</Text></td>
                            <td style={tableCellStyle}>
                                <Text>{publicProfile.fliiinker_profile?.description}</Text>
                            </td>
                        </tr>
                        <tr>
                            <td style={tableCellStyle}><Text strong>Langues parlées:</Text></td>
                            <td style={tableCellStyle}>
                                <Text>{publicProfile.fliiinker_profile?.spoken_languages ? publicProfile.fliiinker_profile?.spoken_languages.join(', ') : 'None'}</Text>
                            </td>
                        </tr>
                        <tr>
                            <td style={tableCellStyle}><Text strong>Is Validated:</Text></td>
                            <td style={tableCellStyle}>
                                <Text>{publicProfile.fliiinker_profile?.is_validated || "Not specified"}</Text>
                            </td>
                        </tr>
                        <tr>
                            <td style={tableCellStyle}><Text strong>Is Validated:</Text></td>
                            <td style={tableCellStyle}>
                                <Text>{publicProfile.fliiinker_profile?.is_validated || "Not specified"}</Text>
                            </td>
                        </tr>
                        <tr>
                            <td style={tableCellStyle}><Text strong>Created on (Fliiinker Profile):</Text></td>
                            <td style={tableCellStyle}>
                                <Text type="secondary">{new Date(publicProfile.fliiinker_profile?.created_at).toLocaleDateString()}</Text>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div style={{ textAlign: "center", marginTop: "20px" }}>
                    <Popconfirm
                        title="Êtes-vous sûr de vouloir supprimer cet utilisateur ?"
                        onConfirm={handleDelete}
                        okText="Oui"
                        cancelText="Non"
                    >
                        <Button danger>Supprimer</Button>
                    </Popconfirm>
                </div>
            </Card>
        </div>
    );
};

// Styles pour les cellules du tableau
const tableCellStyle: React.CSSProperties = {
    padding: '12px 8px',
    borderBottom: '1px solid #f0f0f0',
    verticalAlign: 'top',
};
