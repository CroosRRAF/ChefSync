import React from "react";
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
    <div className="min-h-screen bg-background">
      <DeliveryNavbar />
      <main className="container mx-auto px-4 py-6">
        {(title || description) && (
          <div className="mb-8">
            {title && (
              <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            )}
            {description && (
              <p className="text-muted-foreground mt-2">{description}</p>
            )}
          </div>
        )}
        {children}
      </main>
    </div>
  );
};

export default DeliveryLayout;
