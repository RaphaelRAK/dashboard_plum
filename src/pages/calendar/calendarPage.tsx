// src/pages/WeeklyCalendarPage.tsx
import React, { useState } from "react";
import WeeklyCalendar from "../../components/calendar/weeklyCalendar";
import { Button, Tooltip } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";

const WeeklyCalendarPage: React.FC = () => {
  const [siderVisible, setSiderVisible] = useState<boolean>(true);

  const toggleSider = () => {
    setSiderVisible(!siderVisible);
  };

  return (
    <div>
      <Tooltip title={siderVisible ? "Masquer le calendrier" : "Afficher le calendrier"}>
        <Button 
          type="primary" 
          icon={siderVisible ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          onClick={toggleSider}
          style={{ 
            marginBottom: '8px',
            position: 'fixed',
            zIndex: 1000,
            left: siderVisible ? '235px' : '10px',
            top: '70px',
            transition: 'all 0.3s'
          }}
        />
      </Tooltip>
      <WeeklyCalendar siderVisible={siderVisible} />
    </div>
  );
};

export default WeeklyCalendarPage;
