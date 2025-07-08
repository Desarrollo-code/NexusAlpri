
import React from 'react';

interface AnnouncementEmailProps {
  title: string;
  content: string;
  authorName: string;
  platformName: string;
}

export const AnnouncementEmail: React.FC<AnnouncementEmailProps> = ({
  title,
  content,
  authorName,
  platformName,
}) => {
  return (
    <div style={{ fontFamily: 'sans-serif', lineHeight: '1.5', padding: '20px', backgroundColor: '#f4f4f4' }}>
      <div style={{ maxWidth: '600px', margin: 'auto', backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
        <h1 style={{ color: '#333', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Nuevo Anuncio en {platformName}</h1>
        <h2 style={{ color: '#555' }}>{title}</h2>
        <p style={{ color: '#666', fontSize: '14px' }}>Publicado por: <strong>{authorName}</strong></p>
        <div
          style={{
            whiteSpace: 'pre-wrap',
            backgroundColor: '#f9f9f9',
            padding: '15px',
            borderRadius: '5px',
            border: '1px solid #eee',
            color: '#333',
          }}
        >
            {content}
        </div>
        <p style={{ marginTop: '20px', fontSize: '12px', color: '#999', textAlign: 'center' }}>
          Recibiste este correo porque eres miembro de {platformName}.
        </p>
      </div>
    </div>
  );
};
