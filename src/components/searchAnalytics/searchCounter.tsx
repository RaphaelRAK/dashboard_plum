import React, { useEffect, useState } from 'react';
import { Search } from '../../types/search';
import { fetchSearchAnalytics, subscribeToSearchAnalytics, unsubscribeFromSearchAnalytics } from '../../services/analytics/analyticsApi';
import { Card, Statistic } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const SearchCounter: React.FC = () => {
    const [searches, setSearches] = useState<Search[]>([]);

    useEffect(() => {
        // Charger les données initiales
        const loadInitialData = async () => {
            try {
                const initialData = await fetchSearchAnalytics();
                setSearches(initialData);
            } catch (error) {
                console.error("Erreur lors du chargement initial:", error);
            }
        };

        loadInitialData();

        // S'abonner aux mises à jour en temps réel
        const channel = subscribeToSearchAnalytics(
            (newSearch) => setSearches(prev => [...prev, newSearch]),
            setSearches
        );

        // Nettoyage lors du démontage du composant
        return () => {
            unsubscribeFromSearchAnalytics(channel);
        };
    }, []);

    return (
        <Card style={{ alignContent: 'center' }}>
            <Statistic
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <SearchOutlined />
                        <span>Recherches en cours</span>
                    </div>
                }
                value={searches.length}
                valueStyle={{ 
                    color: '#1890ff',
                    fontSize: '2.5rem',
                    textAlign: 'center',
                }}
            />
        </Card>
    );
};

export default SearchCounter;