export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    },
    dialog: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '24px',
      minWidth: '400px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
    },
    message: {
      fontSize: '16px',
      marginBottom: '24px',
      color: '#333'
    },
    buttons: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end'
    },
    cancelBtn: {
      padding: '10px 20px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      backgroundColor: 'white',
      cursor: 'pointer',
      fontSize: '14px'
    },
    confirmBtn: {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '4px',
      backgroundColor: '#ef4444',
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500'
    }
  };

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div style={styles.message}>{message}</div>
        <div style={styles.buttons}>
          <button onClick={onCancel} style={styles.cancelBtn}>Cancel</button>
          <button onClick={onConfirm} style={styles.confirmBtn}>Remove</button>
        </div>
      </div>
    </div>
  );
}
