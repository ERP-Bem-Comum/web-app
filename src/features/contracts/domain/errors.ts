export type ContractError =
  | 'contract:not_found'
  | 'contract:unauthorized'
  | 'contract:invalid_input'
  | 'contract:forbidden_delete'
  | 'contract:service_order_value_exceeded'
  | 'contract:missing_payment_info'
  | 'repo:failure'
