// src/pages/FliiinkerList.tsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { List } from "@refinedev/antd";
import { Drawer, Spin } from "antd";
import { CustomerTable } from "../../components/customer/customerList";
import { CustomerDetails } from "../../components/customer/customerDetails";
import { Public_profile } from "../../types/public_profileTypes";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { fetchAllCustomersService } from "../../services/public_profile/publicProfileApi";
import { setCustomers } from "../../store/slices/publicProfileSlice";

export const CustomersLists: React.FC = () => {
  const [isPageMounted, setIsPageMounted] = useState(false);
  const dispatch = useAppDispatch();
  const { profiles, loading, error, lastFetchTimestamp } = useSelector(
    (state: RootState) => state.publicProfiles,
  );
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<Public_profile | null>(null);

  useEffect(() => {
    // Charger uniquement quand la page customer est visitée
    const loadCustomerData = async () => {
      const now = Date.now();

      // Vérifier si les profils sont vides ou
      // si les données ont été récupérées il y a plus de 5 minutes
      if (
        Object.keys(profiles).length === 0 ||
        now - lastFetchTimestamp > 5 * 60 * 1000
      ) {
        try {
          // Appeler le service pour récupérer tous les clients
          const { data, error } = await fetchAllCustomersService();
          if (error) {
            console.error("❌ Erreur lors du chargement des clients:", error);
            return;
          }
          // Dispatch une action pour mettre à jour le store avec les clients
          dispatch(setCustomers(data));
        } catch (error) {
          console.error("❌ Erreur inattendue:", error);
        }
      }
    };

    loadCustomerData(); // Appeler la fonction pour charger les données des clients
  }, [dispatch, profiles, lastFetchTimestamp]); // Dépendances de useEffect

  // Mémorisation du filtrage des données
  // useMemo sert à mémoriser les données et les réutiliser si les données ne changent pas
  // Pas besoin de filtrer car fetchAllCustomersService récupère déjà seulement les customers
  const customerData = useMemo(() => {
    const customers = Object.values(profiles);
    console.log("🔍 [DEBUG] Customers récupérés:", customers.length, customers);
    return customers;
  }, [profiles]);

  // Mémorisation des gestionnaires d'événements
  // useCallback sert à mémoriser les fonctions et les réutiliser si les données ne changent pas
  const handleViewCustomer = useCallback((customer: Public_profile) => {
    setSelectedCustomer(customer);
    setIsDrawerVisible(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerVisible(false);
    setSelectedCustomer(null);
  }, []);

  if (loading) return <Spin tip="Chargement des données..." />;
  if (error) return <div>{error}</div>;

  return (
    <>
      <List title="Customers">
        <CustomerTable onView={handleViewCustomer} />
      </List>

      <Drawer
        title="Customer Details"
        placement="right"
        width={500}
        onClose={handleCloseDrawer}
        open={isDrawerVisible}
        destroyOnClose
      >
        {selectedCustomer && (
          <CustomerDetails
            publicProfile={selectedCustomer}
            onClose={handleCloseDrawer}
          />
        )}
      </Drawer>
    </>
  );
};
