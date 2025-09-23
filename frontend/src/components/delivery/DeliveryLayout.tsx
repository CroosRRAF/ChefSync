import React from "react";
import "../../styles/delivery-theme.css";
import DeliveryNavbar from "./DeliveryNavbar";

interface DeliveryLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const DeliveryLayout: React.FC<DeliveryLayoutProps> = ({
  children,
  title,
  description,
}) => {
  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--background-off-white)",
        minHeight: "100vh",
      }}
    >
      <DeliveryNavbar />
      <main className="container mx-auto px-4 py-6">
        {(title || description) && (
          <div className="mb-8">
            {title && (
              <h1
                className="text-3xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-2" style={{ color: "var(--text-cool-grey)" }}>
                {description}
              </p>
            )}
          </div>
        )}
        {children}
      </main>
    </div>
  );
};

export default DeliveryLayout;
