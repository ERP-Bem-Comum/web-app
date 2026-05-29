export function LoadingTable() {
  return (
    <div
      className="flex justify-center items-center py-5"
      style={{ margin: 'auto', width: '100%' }}
    >
      <span
        aria-label="Carregando"
        role="status"
        style={{
          width: 30,
          height: 30,
          border: '3px solid #D7F3FC',
          borderTopColor: '#32C6F4',
          borderRadius: '50%',
          display: 'inline-block',
          animation: 'table-loader-spin 800ms linear infinite',
        }}
      />
      <style jsx>{`
        @keyframes table-loader-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
