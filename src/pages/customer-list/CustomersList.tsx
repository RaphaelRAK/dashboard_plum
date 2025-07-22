import React, { useState } from "react"; 
import { List, useTable, DeleteButton } from "@refinedev/antd"; 
import { Table, Tag, Space, Button, Drawer } from "antd"; 
import { EyeOutlined } from "@ant-design/icons"; 
import { Customer } from "../../types/customerTypes"; 
import { CustomerDetails } from "./customerDetails";

// Déclaration du composant fonctionnel PlumersList
export const CustomersList: React.FC = () => {
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);

    // Utilisation du hook useTable pour gérer les propriétés de la table
    const { tableProps } = useTable<Customer>({
        pagination: {
            pageSize: 12,    // Nombre d'éléments par page
            current: 1,      // Page actuelle
        },
        sorters: {
            initial: [{ field: "created_at", order: "desc" }],
        },
        syncWithLocation: true,
    });

    const handleViewCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsDrawerVisible(true);
    };

    return (
        <>
            <List title="Customers"> {/* Titre de la liste */}
                <Table {...tableProps} rowKey="id" pagination={{
                    ...tableProps.pagination,
                    showTotal: (total) => `Total ${total} items`,  // Affiche le nombre total d'éléments
                    showSizeChanger: true,                         // Permet de changer le nombre d'éléments par page
                    showQuickJumper: true,                        // Permet de sauter directement à une page spécifique
                    pageSizeOptions: ['10', '12', '20', '50', '100'], // Options pour le nombre d'éléments par page
                }}> {/* Table avec pagination */}
                    {/* Avatar Column */}
                    <Table.Column<Customer>
                        title="Avatar" // Titre de la colonne
                        dataIndex="avatars" // Index des données pour cette colonne
                        key="avatars" // Clé unique pour cette colonne
                        render={(avatars: string[] | undefined) => // Fonction de rendu pour afficher l'avatar
                            avatars && avatars.length > 0 ? ( // Vérifie si des avatars existent
                                <img
                                    src={avatars[0]} // Affiche le premier avatar
                                    alt="Avatar" // Texte alternatif pour l'image
                                    style={{
                                        width: "50px", // Largeur de l'avatar
                                        height: "50px", // Hauteur de l'avatar
                                        borderRadius: "50%", // Arrondi pour un effet circulaire
                                        objectFit: "cover", // Ajustement de l'image
                                    }}
                                />
                            ) : (
                                <Tag>No Avatar</Tag> // Affiche un tag si aucun avatar n'est disponible
                            )
                        }
                    />

                    {/* Name Column */}
                    <Table.Column<Customer>
                        title="Name" // Titre de la colonne
                        dataIndex="first_name" // Index des données pour cette colonne
                        key="name" // Clé unique pour cette colonne
                        sorter // Permet le tri sur cette colonne
                        render={(_, record) => // Fonction de rendu pour afficher le nom complet
                            `${record.first_name} ${record.last_name}` // Concatène le prénom et le nom
                        }
                    />

                    {/* Email Column */}
                    <Table.Column<Customer>
                        title="Email" // Titre de la colonne
                        dataIndex="email" // Index des données pour cette colonne
                        key="email" // Clé unique pour cette colonne
                        sorter // Permet le tri sur cette colonne
                    />

                    {/* Phone Number Column */}
                    <Table.Column<Customer>
                        title="Phone Number" // Titre de la colonne
                        dataIndex="phone" // Index des données pour cette colonne
                        key="phone" // Clé unique pour cette colonne
                    />

                    {/* Status Column */}
    

                    {/* Created At Column */}
                    <Table.Column<Customer>
                        title="Created At" // Titre de la colonne
                        dataIndex="created_at" // Index des données pour cette colonne
                        key="created_at" // Clé unique pour cette colonne
                        sorter // Permet le tri sur cette colonne
                        render={(text: string) => // Fonction de rendu pour afficher la date de création
                            new Date(text).toLocaleDateString() // Formate la date pour l'affichage
                        }
                    />

                    {/* Nouvelle colonne Action */}
                    <Table.Column<Customer>
                        title="Actions"
                        key="actions"
                        render={(_, record) => (
                            <Space>
                                <Button
                                    type="primary"
                                    icon={<EyeOutlined />}
                                    onClick={() => handleViewCustomer(record)}
                                />
                                <DeleteButton 
                                    size="small"
                                    recordItemId={record.id}
                                />
                            </Space>
                        )}
                    />
                </Table>
            </List>

            {/* Drawer pour afficher les détails */}
            <Drawer
                title="Détails du Customer"
                placement="right"
                width={500}
                onClose={() => setIsDrawerVisible(false)}
                open={isDrawerVisible}
            >
                {selectedCustomer && (
                    <CustomerDetails 
                        customer={selectedCustomer} 
                        onClose={() => setIsDrawerVisible(false)}
                    />
                )}
            </Drawer>
        </>
    );
};