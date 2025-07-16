#!/usr/bin/env python3
"""
Plaid API Field Index - Based on Official Endpoint Documentation
Maps API endpoints and field references to specific documentation anchors
"""

PLAID_API_INDEX = {
    # AUTH API - Account verification and routing numbers
    "auth": {
        "base_url": "https://plaid.com/docs/api/products/auth/",
        "endpoints": {
            "/auth/get": {
                "anchor": "#authget",
                "description": "Retrieve bank account information to set up electronic funds transfers"
            },
            "/bank_transfer/event/list": {
                "anchor": "#bank_transfereventlist", 
                "description": "List bank transfer events based on specified filter criteria"
            },
            "/bank_transfer/event/sync": {
                "anchor": "#bank_transfereventsync",
                "description": "Request up to the next 25 Plaid-initiated bank transfer events"
            }
        },
        "request_fields": {
            # /auth/get request fields
            "client_id": "#auth-get-request-client-id",
            "secret": "#auth-get-request-secret",
            "access_token": "#auth-get-request-access-token", 
            "options": "#auth-get-request-options",
            "account_ids": "#auth-get-request-options-account-ids"
        },
        "response_fields": {
            # Core response objects
            "accounts": "#auth-get-response-accounts",
            "numbers": "#auth-get-response-numbers", 
            "item": "#auth-get-response-item",
            "request_id": "#auth-get-response-request-id",
            
            # Account details
            "account_id": "#auth-get-response-accounts-account-id",
            "balances": "#auth-get-response-accounts-balances",
            "name": "#auth-get-response-accounts-name",
            "official_name": "#auth-get-response-accounts-official-name",
            "type": "#auth-get-response-accounts-type",
            "subtype": "#auth-get-response-accounts-subtype",
            
            # Numbers for transfers
            "routing": "#auth-get-response-numbers-ach-routing",
            "account": "#auth-get-response-numbers-ach-account",
            "wire_routing": "#auth-get-response-numbers-ach-wire-routing"
        },
        "keywords": ["routing", "account verification", "ACH", "bank account", "account numbers", "electronic transfers"]
    },
    
    # TRANSACTIONS API - Transaction history and categorization  
    "transactions": {
        "base_url": "https://plaid.com/docs/api/products/transactions/",
        "endpoints": {
            "/transactions/sync": {
                "anchor": "#transactionssync",
                "description": "Get incremental transaction updates on an Item"
            },
            "/transactions/get": {
                "anchor": "#transactionsget", 
                "description": "Fetch transaction data"
            },
            "/transactions/recurring/get": {
                "anchor": "#transactionsrecurringget",
                "description": "Fetch recurring transaction data"
            },
            "/transactions/refresh": {
                "anchor": "#transactionsrefresh",
                "description": "Refresh transaction data"
            },
            "/categories/get": {
                "anchor": "#categoriesget",
                "description": "Fetch all transaction categories"
            },
            # Processor endpoints
            "/processor/transactions/sync": {
                "anchor": "#processortransactionssync",
                "description": "Processor transactions sync"
            },
            "/processor/transactions/get": {
                "anchor": "#processortransactionsget", 
                "description": "Processor transactions get"
            }
        },
        "request_fields": {
            # Common request fields
            "client_id": "#transactions-sync-request-client-id",
            "secret": "#transactions-sync-request-secret",
            "access_token": "#transactions-sync-request-access-token",
            
            # Sync-specific fields
            "cursor": "#transactions-sync-request-cursor",
            "count": "#transactions-sync-request-count",
            "options": "#transactions-sync-request-options",
            "include_original_description": "#transactions-sync-request-options-include-original-description",
            "days_requested": "#transactions-sync-request-options-days-requested",
            "account_id": "#transactions-sync-request-options-account-id"
        },
        "response_fields": {
            # Sync response structure
            "transactions_update_status": "#transactions-sync-response-transactions-update-status",
            "accounts": "#transactions-sync-response-accounts",
            "added": "#transactions-sync-response-added",
            "modified": "#transactions-sync-response-modified", 
            "removed": "#transactions-sync-response-removed",
            "next_cursor": "#transactions-sync-response-next-cursor",
            "has_more": "#transactions-sync-response-has-more",
            
            # Account object fields
            "account_id": "#transactions-sync-response-accounts-account-id",
            "balances": "#transactions-sync-response-accounts-balances",
            "available": "#transactions-sync-response-accounts-balances-available",
            "current": "#transactions-sync-response-accounts-balances-current",
            "limit": "#transactions-sync-response-accounts-balances-limit",
            "iso_currency_code": "#transactions-sync-response-accounts-balances-iso-currency-code",
            "unofficial_currency_code": "#transactions-sync-response-accounts-balances-unofficial-currency-code",
            "name": "#transactions-sync-response-accounts-name",
            "official_name": "#transactions-sync-response-accounts-official-name",
            "type": "#transactions-sync-response-accounts-type",
            "subtype": "#transactions-sync-response-accounts-subtype",
            "verification_status": "#transactions-sync-response-accounts-verification-status",
            
            # Transaction object fields (from sync response)
            "transaction_id": "#transactions-sync-response-added-transaction-id",
            "amount": "#transactions-sync-response-added-amount",
            "date": "#transactions-sync-response-added-date",
            "merchant_name": "#transactions-sync-response-added-merchant-name",
            "location": "#transactions-sync-response-added-location",
            "payment_channel": "#transactions-sync-response-added-payment-channel",
            "personal_finance_category": "#transactions-sync-response-added-personal-finance-category",
            "counterparties": "#transactions-sync-response-added-counterparties",
            "pending": "#transactions-sync-response-added-pending",
            
            # Location sub-fields
            "address": "#transactions-sync-response-added-location-address",
            "city": "#transactions-sync-response-added-location-city",
            "region": "#transactions-sync-response-added-location-region",
            "postal_code": "#transactions-sync-response-added-location-postal-code",
            "country": "#transactions-sync-response-added-location-country",
            "lat": "#transactions-sync-response-added-location-lat",
            "lon": "#transactions-sync-response-added-location-lon",
            
            # Personal finance category sub-fields
            "primary": "#transactions-sync-response-added-personal-finance-category-primary",
            "detailed": "#transactions-sync-response-added-personal-finance-category-detailed",
            "confidence_level": "#transactions-sync-response-added-personal-finance-category-confidence-level",
            
            # Counterparties sub-fields
            "counterparty_name": "#transactions-sync-response-added-counterparties-name",
            "counterparty_type": "#transactions-sync-response-added-counterparties-type",
            "website": "#transactions-sync-response-added-counterparties-website",
            "logo_url": "#transactions-sync-response-added-counterparties-logo-url"
        },
        "webhooks": {
            "SYNC_UPDATES_AVAILABLE": "#sync_updates_available",
            "INITIAL_UPDATE": "#initial_update",
            "HISTORICAL_UPDATE": "#historical_update", 
            "DEFAULT_UPDATE": "#default_update"
        },
        "keywords": ["transaction history", "spending", "categorization", "sync", "merchant", "incremental updates"]
    },
    
    # INVESTMENTS API - Investment holdings and transactions
    "investments": {
        "base_url": "https://plaid.com/docs/api/products/investments/",
        "endpoints": {
            "/investments/holdings/get": {
                "anchor": "#investmentsholdingsget",
                "description": "Fetch investment holdings"
            },
            "/investments/transactions/get": {
                "anchor": "#investmentstransactionsget", 
                "description": "Fetch investment transactions"
            },
            "/investments/refresh": {
                "anchor": "#investmentsrefresh",
                "description": "Refresh investment transactions"
            },
            # Processor endpoints
            "/processor/investments/holdings/get": {
                "anchor": "#processorinvestmentsholdingsget",
                "description": "Fetch Investments Holdings data"
            },
            "/processor/investments/transactions/get": {
                "anchor": "#processorinvestmentstransactionsget",
                "description": "Fetch Investments Transactions data"
            }
        },
        "request_fields": {
            # Common request fields
            "client_id": "#investments-holdings-get-request-client-id",
            "secret": "#investments-holdings-get-request-secret", 
            "access_token": "#investments-holdings-get-request-access-token",
            "options": "#investments-holdings-get-request-options",
            "account_ids": "#investments-holdings-get-request-options-account-ids"
        },
        "response_fields": {
            # Main response objects
            "accounts": "#investments-holdings-get-response-accounts",
            "holdings": "#investments-holdings-get-response-holdings",
            "securities": "#investments-holdings-get-response-securities",
            "item": "#investments-holdings-get-response-item",
            
            # Account fields
            "account_id": "#investments-holdings-get-response-accounts-account-id",
            "balances": "#investments-holdings-get-response-accounts-balances",
            "name": "#investments-holdings-get-response-accounts-name",
            "official_name": "#investments-holdings-get-response-accounts-official-name",
            "type": "#investments-holdings-get-response-accounts-type",
            "subtype": "#investments-holdings-get-response-accounts-subtype",
            
            # Holdings fields
            "security_id": "#investments-holdings-get-response-holdings-security-id",
            "quantity": "#investments-holdings-get-response-holdings-quantity",
            "institution_price": "#investments-holdings-get-response-holdings-institution-price",
            "institution_value": "#investments-holdings-get-response-holdings-institution-value", 
            "cost_basis": "#investments-holdings-get-response-holdings-cost-basis",
            
            # Securities fields
            "ticker_symbol": "#investments-holdings-get-response-securities-ticker-symbol",
            "close_price": "#investments-holdings-get-response-securities-close-price",
            "market_identifier_code": "#investments-holdings-get-response-securities-market-identifier-code"
        },
        "keywords": ["investment holdings", "securities", "portfolio", "stocks", "bonds", "mutual funds", "asset management"]
    },
    
    # IDENTITY API - Personal information verification
    "identity": {
        "base_url": "https://plaid.com/docs/api/products/identity/",
        "endpoints": {
            "/identity/get": {
                "anchor": "#identityget",
                "description": "Retrieve identity information for an account"
            },
            "/identity/match": {
                "anchor": "#identitymatch", 
                "description": "Compare provided user information with identity data on file"
            }
        },
        "request_fields": {
            # /identity/get request fields
            "client_id": "#identity-get-request-client-id",
            "secret": "#identity-get-request-secret",
            "access_token": "#identity-get-request-access-token",
            "options": "#identity-get-request-options",
            "account_ids": "#identity-get-request-options-account-ids",
            
            # /identity/match specific request fields
            "user": "#identity-match-request-user",
            "legal_name": "#identity-match-request-user-legal-name",
            "phone_number": "#identity-match-request-user-phone-number",
            "email_address": "#identity-match-request-user-email-address",
            "address": "#identity-match-request-user-address",
            "city": "#identity-match-request-user-address-city",
            "region": "#identity-match-request-user-address-region",
            "street": "#identity-match-request-user-address-street",
            "postal_code": "#identity-match-request-user-address-postal-code",
            "country": "#identity-match-request-user-address-country"
        },
        "response_fields": {
            # Common response fields
            "accounts": "#identity-get-response-accounts",
            "item": "#identity-get-response-item",
            "request_id": "#identity-get-response-request-id",
            
            # Account details
            "account_id": "#identity-get-response-accounts-account-id",
            "balances": "#identity-get-response-accounts-balances",
            "available": "#identity-get-response-accounts-balances-available",
            "current": "#identity-get-response-accounts-balances-current",
            "limit": "#identity-get-response-accounts-balances-limit",
            "iso_currency_code": "#identity-get-response-accounts-balances-iso-currency-code",
            "unofficial_currency_code": "#identity-get-response-accounts-balances-unofficial-currency-code",
            "last_updated_datetime": "#identity-get-response-accounts-balances-last-updated-datetime",
            "mask": "#identity-get-response-accounts-mask",
            "name": "#identity-get-response-accounts-name",
            "official_name": "#identity-get-response-accounts-official-name",
            "type": "#identity-get-response-accounts-type",
            "subtype": "#identity-get-response-accounts-subtype",
            "verification_status": "#identity-get-response-accounts-verification-status",
            "verification_name": "#identity-get-response-accounts-verification-name",
            "verification_insights": "#identity-get-response-accounts-verification-insights",
            "persistent_account_id": "#identity-get-response-accounts-persistent-account-id",
            "holder_category": "#identity-get-response-accounts-holder-category",
            
            # Owners and identity data
            "owners": "#identity-get-response-accounts-owners",
            "names": "#identity-get-response-accounts-owners-names",
            "phone_numbers": "#identity-get-response-accounts-owners-phone-numbers",
            "emails": "#identity-get-response-accounts-owners-emails",
            "addresses": "#identity-get-response-accounts-owners-addresses",
            
            # Phone numbers array fields
            "phone_data": "#identity-get-response-accounts-owners-phone-numbers-data",
            "phone_primary": "#identity-get-response-accounts-owners-phone-numbers-primary",
            "phone_type": "#identity-get-response-accounts-owners-phone-numbers-type",
            
            # Emails array fields
            "email_data": "#identity-get-response-accounts-owners-emails-data",
            "email_primary": "#identity-get-response-accounts-owners-emails-primary",
            "email_type": "#identity-get-response-accounts-owners-emails-type",
            
            # Addresses array fields
            "address_data": "#identity-get-response-accounts-owners-addresses-data",
            "address_primary": "#identity-get-response-accounts-owners-addresses-primary",
            "address_city": "#identity-get-response-accounts-owners-addresses-data-city",
            "address_region": "#identity-get-response-accounts-owners-addresses-data-region",
            "address_street": "#identity-get-response-accounts-owners-addresses-data-street",
            "address_postal_code": "#identity-get-response-accounts-owners-addresses-data-postal-code",
            "address_country": "#identity-get-response-accounts-owners-addresses-data-country",
            
            # Identity/match specific response fields
            "legal_name_match": "#identity-match-response-accounts-legal-name",
            "legal_name_score": "#identity-match-response-accounts-legal-name-score",
            "phone_number_match": "#identity-match-response-accounts-phone-number",
            "phone_number_score": "#identity-match-response-accounts-phone-number-score",
            "email_address_match": "#identity-match-response-accounts-email-address",
            "email_address_score": "#identity-match-response-accounts-email-address-score",
            "address_match": "#identity-match-response-accounts-address",
            "address_score": "#identity-match-response-accounts-address-score"
        },
        "keywords": ["identity verification", "personal information", "KYC", "name verification", "address verification", "phone verification", "email verification"]
    },
    
    # LIABILITIES API - Debt and loan information
    "liabilities": {
        "base_url": "https://plaid.com/docs/api/products/liabilities/",
        "endpoints": {
            "/liabilities/get": {
                "anchor": "#liabilitiesget",
                "description": "Retrieve Liabilities data"
            }
        },
        "request_fields": {
            "client_id": "#liabilities-get-request-client-id",
            "secret": "#liabilities-get-request-secret",
            "access_token": "#liabilities-get-request-access-token",
            "options": "#liabilities-get-request-options",
            "account_ids": "#liabilities-get-request-options-account-ids"
        },
        "response_fields": {
            # Main response objects
            "accounts": "#liabilities-get-response-accounts",
            "item": "#liabilities-get-response-item",
            "liabilities": "#liabilities-get-response-liabilities",
            "request_id": "#liabilities-get-response-request-id",
            
            # Account details
            "account_id": "#liabilities-get-response-accounts-account-id",
            "balances": "#liabilities-get-response-accounts-balances",
            "available": "#liabilities-get-response-accounts-balances-available",
            "current": "#liabilities-get-response-accounts-balances-current",
            "limit": "#liabilities-get-response-accounts-balances-limit",
            "iso_currency_code": "#liabilities-get-response-accounts-balances-iso-currency-code",
            "unofficial_currency_code": "#liabilities-get-response-accounts-balances-unofficial-currency-code",
            "last_updated_datetime": "#liabilities-get-response-accounts-balances-last-updated-datetime",
            "mask": "#liabilities-get-response-accounts-mask",
            "name": "#liabilities-get-response-accounts-name",
            "official_name": "#liabilities-get-response-accounts-official-name",
            "type": "#liabilities-get-response-accounts-type",
            "subtype": "#liabilities-get-response-accounts-subtype",
            "verification_status": "#liabilities-get-response-accounts-verification-status",
            "persistent_account_id": "#liabilities-get-response-accounts-persistent-account-id",
            
            # Credit card liability details
            "credit": "#liabilities-get-response-liabilities-credit",
            "credit_account_id": "#liabilities-get-response-liabilities-credit-account-id",
            "aprs": "#liabilities-get-response-liabilities-credit-aprs",
            "balance_transfer_apr": "#liabilities-get-response-liabilities-credit-aprs-balance-transfer-apr",
            "cash_apr": "#liabilities-get-response-liabilities-credit-aprs-cash-apr",
            "purchase_apr": "#liabilities-get-response-liabilities-credit-aprs-purchase-apr",
            "special_apr": "#liabilities-get-response-liabilities-credit-aprs-special-apr",
            "is_overdue": "#liabilities-get-response-liabilities-credit-is-overdue",
            "last_payment_amount": "#liabilities-get-response-liabilities-credit-last-payment-amount",
            "last_payment_date": "#liabilities-get-response-liabilities-credit-last-payment-date",
            "last_statement_balance": "#liabilities-get-response-liabilities-credit-last-statement-balance",
            "last_statement_issue_date": "#liabilities-get-response-liabilities-credit-last-statement-issue-date",
            "minimum_payment_amount": "#liabilities-get-response-liabilities-credit-minimum-payment-amount",
            "next_payment_due_date": "#liabilities-get-response-liabilities-credit-next-payment-due-date",
            
            # Mortgage liability details
            "mortgage": "#liabilities-get-response-liabilities-mortgage",
            "mortgage_account_id": "#liabilities-get-response-liabilities-mortgage-account-id",
            "account_number": "#liabilities-get-response-liabilities-mortgage-account-number",
            "current_late_fee": "#liabilities-get-response-liabilities-mortgage-current-late-fee",
            "escrow_balance": "#liabilities-get-response-liabilities-mortgage-escrow-balance",
            "has_pmi": "#liabilities-get-response-liabilities-mortgage-has-pmi",
            "has_prepayment_penalty": "#liabilities-get-response-liabilities-mortgage-has-prepayment-penalty",
            "interest_rate": "#liabilities-get-response-liabilities-mortgage-interest-rate",
            "last_payment_amount": "#liabilities-get-response-liabilities-mortgage-last-payment-amount",
            "last_payment_date": "#liabilities-get-response-liabilities-mortgage-last-payment-date",
            "loan_type_description": "#liabilities-get-response-liabilities-mortgage-loan-type-description",
            "loan_term": "#liabilities-get-response-liabilities-mortgage-loan-term",
            "maturity_date": "#liabilities-get-response-liabilities-mortgage-maturity-date",
            "next_monthly_payment": "#liabilities-get-response-liabilities-mortgage-next-monthly-payment",
            "next_payment_due_date": "#liabilities-get-response-liabilities-mortgage-next-payment-due-date",
            "origination_date": "#liabilities-get-response-liabilities-mortgage-origination-date",
            "origination_principal_amount": "#liabilities-get-response-liabilities-mortgage-origination-principal-amount",
            "past_due_amount": "#liabilities-get-response-liabilities-mortgage-past-due-amount",
            "property_address": "#liabilities-get-response-liabilities-mortgage-property-address",
            "ytd_interest_paid": "#liabilities-get-response-liabilities-mortgage-ytd-interest-paid",
            "ytd_principal_paid": "#liabilities-get-response-liabilities-mortgage-ytd-principal-paid",
            
            # Student loan liability details
            "student": "#liabilities-get-response-liabilities-student",
            "student_account_id": "#liabilities-get-response-liabilities-student-account-id",
            "student_account_number": "#liabilities-get-response-liabilities-student-account-number",
            "disbursement_dates": "#liabilities-get-response-liabilities-student-disbursement-dates",
            "expected_payoff_date": "#liabilities-get-response-liabilities-student-expected-payoff-date",
            "guarantor": "#liabilities-get-response-liabilities-student-guarantor",
            "student_interest_rate": "#liabilities-get-response-liabilities-student-interest-rate",
            "is_overdue": "#liabilities-get-response-liabilities-student-is-overdue",
            "student_last_payment_amount": "#liabilities-get-response-liabilities-student-last-payment-amount",
            "student_last_payment_date": "#liabilities-get-response-liabilities-student-last-payment-date",
            "student_last_statement_balance": "#liabilities-get-response-liabilities-student-last-statement-balance",
            "student_last_statement_issue_date": "#liabilities-get-response-liabilities-student-last-statement-issue-date",
            "loan_name": "#liabilities-get-response-liabilities-student-loan-name",
            "loan_status": "#liabilities-get-response-liabilities-student-loan-status",
            "student_minimum_payment_amount": "#liabilities-get-response-liabilities-student-minimum-payment-amount",
            "student_next_payment_due_date": "#liabilities-get-response-liabilities-student-next-payment-due-date",
            "origination_principal_amount": "#liabilities-get-response-liabilities-student-origination-principal-amount",
            "outstanding_interest_amount": "#liabilities-get-response-liabilities-student-outstanding-interest-amount",
            "payment_reference_number": "#liabilities-get-response-liabilities-student-payment-reference-number",
            "pslf_status": "#liabilities-get-response-liabilities-student-pslf-status",
            "repayment_plan": "#liabilities-get-response-liabilities-student-repayment-plan",
            "sequence_number": "#liabilities-get-response-liabilities-student-sequence-number",
            "servicer_address": "#liabilities-get-response-liabilities-student-servicer-address",
            "ytd_interest_paid": "#liabilities-get-response-liabilities-student-ytd-interest-paid",
            "ytd_principal_paid": "#liabilities-get-response-liabilities-student-ytd-principal-paid"
        },
        "webhooks": {
            "DEFAULT_UPDATE": "#default_update"
        },
        "keywords": ["debt", "loans", "credit cards", "mortgage", "student loans", "liabilities", "credit accounts"]
    },
    
    # ASSETS API - Asset reports and verification
    "assets": {
        "base_url": "https://plaid.com/docs/api/products/assets/",
        "endpoints": {
            "/asset_report/create": {
                "anchor": "#asset_reportcreate",
                "description": "Create an Asset Report"
            },
            "/asset_report/get": {
                "anchor": "#asset_reportget",
                "description": "Retrieve an Asset Report"
            },
            "/asset_report/pdf/get": {
                "anchor": "#asset_reportpdfget",
                "description": "Retrieve an Asset Report in PDF format"
            },
            "/asset_report/refresh": {
                "anchor": "#asset_reportrefresh",
                "description": "Refresh an Asset Report"
            },
            "/asset_report/filter": {
                "anchor": "#asset_reportfilter",
                "description": "Filter an Asset Report"
            },
            "/asset_report/remove": {
                "anchor": "#asset_reportremove",
                "description": "Delete an Asset Report"
            },
            "/asset_report/audit_copy/create": {
                "anchor": "#asset_reportaudit_copycreate",
                "description": "Create Asset Report Audit Copy"
            },
            "/asset_report/audit_copy/remove": {
                "anchor": "#asset_reportaudit_copyremove",
                "description": "Remove Asset Report Audit Copy"
            },
            "/credit/relay/create": {
                "anchor": "#credit_relaycreate",
                "description": "Create a Credit Relay token"
            },
            "/credit/relay/get": {
                "anchor": "#credit_relayget",
                "description": "Retrieve Credit Relay information"
            },
            "/credit/relay/refresh": {
                "anchor": "#credit_relayrefresh",
                "description": "Refresh Credit Relay data"
            },
            "/credit/relay/remove": {
                "anchor": "#credit_relayremove",
                "description": "Remove Credit Relay token"
            },
            "/sandbox/asset_report/fire_webhook": {
                "anchor": "#sandboxasset_reportfire_webhook",
                "description": "Simulate Asset Report webhook in Sandbox"
            }
        },
        "request_fields": {
            # /asset_report/create request fields
            "client_id": "#asset-report-create-request-client-id",
            "secret": "#asset-report-create-request-secret",
            "access_tokens": "#asset-report-create-request-access-tokens",
            "days_requested": "#asset-report-create-request-days-requested",
            "options": "#asset-report-create-request-options",
            "client_report_id": "#asset-report-create-request-options-client-report-id",
            "webhook": "#asset-report-create-request-options-webhook",
            "add_ons": "#asset-report-create-request-options-add-ons",
            "user": "#asset-report-create-request-options-user",
            "client_user_id": "#asset-report-create-request-options-user-client-user-id",
            "first_name": "#asset-report-create-request-options-user-first-name",
            "middle_name": "#asset-report-create-request-options-user-middle-name",
            "last_name": "#asset-report-create-request-options-user-last-name",
            "ssn": "#asset-report-create-request-options-user-ssn",
            "phone_number": "#asset-report-create-request-options-user-phone-number",
            "email": "#asset-report-create-request-options-user-email",
            "require_all_items": "#asset-report-create-request-options-require-all-items",
            
            # /asset_report/get request fields  
            "asset_report_token": "#asset-report-get-request-asset-report-token",
            "include_insights": "#asset-report-get-request-include-insights",
            "fast_report": "#asset-report-get-request-fast-report",
            "days_to_include": "#asset-report-get-request-options-days-to-include",
            
            # /asset_report/refresh request fields
            "refresh_days_requested": "#asset-report-refresh-request-days-requested",
            "refresh_options": "#asset-report-refresh-request-options",
            
            # /asset_report/filter request fields
            "account_ids_to_exclude": "#asset-report-filter-request-account-ids-to-exclude"
        },
        "response_fields": {
            # /asset_report/create response fields
            "asset_report_token": "#asset-report-create-response-asset-report-token",
            "asset_report_id": "#asset-report-create-response-asset-report-id",
            "request_id": "#asset-report-create-response-request-id",
            
            # /asset_report/get response fields - comprehensive asset report structure
            "report": "#asset-report-get-response-report",
            "asset_report_id": "#asset-report-get-response-report-asset-report-id",
            "client_report_id": "#asset-report-get-response-report-client-report-id", 
            "date_generated": "#asset-report-get-response-report-date-generated",
            "days_requested": "#asset-report-get-response-report-days-requested",
            "user": "#asset-report-get-response-report-user",
            "user_client_user_id": "#asset-report-get-response-report-user-client-user-id",
            "user_first_name": "#asset-report-get-response-report-user-first-name",
            "user_middle_name": "#asset-report-get-response-report-user-middle-name",
            "user_last_name": "#asset-report-get-response-report-user-last-name",
            "user_ssn": "#asset-report-get-response-report-user-ssn",
            "user_phone_number": "#asset-report-get-response-report-user-phone-number",
            "user_email": "#asset-report-get-response-report-user-email",
            
            # Items in asset report
            "items": "#asset-report-get-response-report-items",
            "item_id": "#asset-report-get-response-report-items-item-id",
            "institution_name": "#asset-report-get-response-report-items-institution-name",
            "institution_id": "#asset-report-get-response-report-items-institution-id",
            "date_last_updated": "#asset-report-get-response-report-items-date-last-updated",
            
            # Accounts in asset report
            "accounts": "#asset-report-get-response-report-items-accounts",
            "account_id": "#asset-report-get-response-report-items-accounts-account-id",
            "balances": "#asset-report-get-response-report-items-accounts-balances",
            "available": "#asset-report-get-response-report-items-accounts-balances-available",
            "current": "#asset-report-get-response-report-items-accounts-balances-current",
            "limit": "#asset-report-get-response-report-items-accounts-balances-limit",
            "margin_loan_amount": "#asset-report-get-response-report-items-accounts-balances-margin-loan-amount",
            "iso_currency_code": "#asset-report-get-response-report-items-accounts-balances-iso-currency-code",
            "unofficial_currency_code": "#asset-report-get-response-report-items-accounts-balances-unofficial-currency-code",
            "last_updated_datetime": "#asset-report-get-response-report-items-accounts-balances-last-updated-datetime",
            "days_available": "#asset-report-get-response-report-items-accounts-days-available",
            "historical_balances": "#asset-report-get-response-report-items-accounts-historical-balances",
            "mask": "#asset-report-get-response-report-items-accounts-mask",
            "name": "#asset-report-get-response-report-items-accounts-name",
            "official_name": "#asset-report-get-response-report-items-accounts-official-name",
            "persistent_account_id": "#asset-report-get-response-report-items-accounts-persistent-account-id",
            "holder_category": "#asset-report-get-response-report-items-accounts-holder-category",
            "owners": "#asset-report-get-response-report-items-accounts-owners",
            "type": "#asset-report-get-response-report-items-accounts-type",
            "subtype": "#asset-report-get-response-report-items-accounts-subtype",
            "verification_status": "#asset-report-get-response-report-items-accounts-verification-status",
            
            # Transactions in asset report
            "transactions": "#asset-report-get-response-report-items-accounts-transactions",
            "transaction_account_id": "#asset-report-get-response-report-items-accounts-transactions-account-id",
            "transaction_amount": "#asset-report-get-response-report-items-accounts-transactions-amount",
            "transaction_iso_currency_code": "#asset-report-get-response-report-items-accounts-transactions-iso-currency-code",
            "transaction_unofficial_currency_code": "#asset-report-get-response-report-items-accounts-transactions-unofficial-currency-code",
            "transaction_date": "#asset-report-get-response-report-items-accounts-transactions-date",
            "transaction_name": "#asset-report-get-response-report-items-accounts-transactions-name",
            "transaction_merchant_name": "#asset-report-get-response-report-items-accounts-transactions-merchant-name",
            "transaction_pending": "#asset-report-get-response-report-items-accounts-transactions-pending",
            "transaction_id": "#asset-report-get-response-report-items-accounts-transactions-transaction-id",
            "transaction_type": "#asset-report-get-response-report-items-accounts-transactions-transaction-type",
            "transaction_category": "#asset-report-get-response-report-items-accounts-transactions-category",
            "transaction_category_id": "#asset-report-get-response-report-items-accounts-transactions-category-id",
            "transaction_location": "#asset-report-get-response-report-items-accounts-transactions-location",
            "transaction_original_description": "#asset-report-get-response-report-items-accounts-transactions-original-description",
            
            # Investments in asset report
            "holdings": "#asset-report-get-response-report-items-accounts-holdings",
            "securities": "#asset-report-get-response-report-items-accounts-securities",
            "investment_transactions": "#asset-report-get-response-report-items-accounts-investment-transactions",
            
            # Asset report warnings
            "warnings": "#asset-report-get-response-warnings",
            "warning_type": "#asset-report-get-response-warnings-warning-type",
            "warning_code": "#asset-report-get-response-warnings-warning-code",
            "cause": "#asset-report-get-response-warnings-cause"
        },
        "webhooks": {
            "PRODUCT_READY": "#product_ready",
            "ERROR": "#error"
        },
        "keywords": ["asset report", "asset verification", "financial profile", "income verification", "employment verification", "wealth verification", "credit relay"]
    },
    
    # INCOME API - Income verification and employment data
    "income": {
        "base_url": "https://plaid.com/docs/api/products/income/",
        "endpoints": {
            "/user/create": {
                "anchor": "#usercreate",
                "description": "Create a user for income verification"
            },
            "/credit/sessions/get": {
                "anchor": "#creditsessionsget",
                "description": "Get income verification session details"
            },
            "/credit/bank_income/get": {
                "anchor": "#creditbank_incomeget",
                "description": "Retrieve Bank Income Report"
            },
            "/credit/bank_income/pdf/get": {
                "anchor": "#creditbank_incomepdfget",
                "description": "Retrieve Bank Income Report as PDF"
            },
            "/credit/bank_income/refresh": {
                "anchor": "#creditbank_incomerefresh",
                "description": "Refresh Bank Income Report"
            },
            "/credit/payroll_income/get": {
                "anchor": "#creditpayroll_incomeget",
                "description": "Retrieve Payroll Income Report"
            },
            "/credit/employment/get": {
                "anchor": "#creditemploymentget",
                "description": "Retrieve Employment Report"
            },
            "/credit/payroll_income/refresh": {
                "anchor": "#creditpayroll_incomerefresh",
                "description": "Refresh Payroll Income Report"
            }
        },
        "request_fields": {
            "client_id": "#credit-bank-income-get-request-client-id",
            "secret": "#credit-bank-income-get-request-secret",
            "user_token": "#credit-bank-income-get-request-user-token",
            "options": "#credit-bank-income-get-request-options",
            "count": "#credit-bank-income-get-request-options-count"
        },
        "response_fields": {
            "bank_income": "#credit-bank-income-get-response-bank-income",
            "bank_income_id": "#credit-bank-income-get-response-bank-income-bank-income-id",
            "generated_time": "#credit-bank-income-get-response-bank-income-generated-time",
            "days_requested": "#credit-bank-income-get-response-bank-income-days-requested",
            "items": "#credit-bank-income-get-response-bank-income-items",
            "bank_income_accounts": "#credit-bank-income-get-response-bank-income-items-bank-income-accounts",
            "bank_income_sources": "#credit-bank-income-get-response-bank-income-items-bank-income-sources",
            "income_source_id": "#credit-bank-income-get-response-bank-income-items-bank-income-sources-income-source-id",
            "income_description": "#credit-bank-income-get-response-bank-income-items-bank-income-sources-income-description",
            "income_category": "#credit-bank-income-get-response-bank-income-items-bank-income-sources-income-category",
            "bank_income_summary": "#credit-bank-income-get-response-bank-income-bank-income-summary",
            "total_amounts": "#credit-bank-income-get-response-bank-income-bank-income-summary-total-amounts",
            "start_date": "#credit-bank-income-get-response-bank-income-bank-income-summary-start-date",
            "end_date": "#credit-bank-income-get-response-bank-income-bank-income-summary-end-date",
            "income_sources_count": "#credit-bank-income-get-response-bank-income-bank-income-summary-income-sources-count",
            "income_categories_count": "#credit-bank-income-get-response-bank-income-bank-income-summary-income-categories-count",
            "income_transactions_count": "#credit-bank-income-get-response-bank-income-bank-income-summary-income-transactions-count"
        },
        "webhooks": {
            "INCOME_VERIFICATION": "#income_verification",
            "INCOME_VERIFICATION_RISK_SIGNALS": "#income_verification_risk_signals",
            "BANK_INCOME_REFRESH_COMPLETE": "#bank_income_refresh_complete",
            "INCOME_VERIFICATION_REFRESH_RECONNECT_NEEDED": "#income_verification_refresh_reconnect_needed"
        },
        "keywords": ["income verification", "employment verification", "payroll data", "bank income", "salary verification", "earnings", "employment history"]
    },
    
    # ITEMS API - Item management and lifecycle
    "items": {
        "base_url": "https://plaid.com/docs/api/items/",
        "endpoints": {
            "/item/get": {
                "anchor": "#itemget",
                "description": "Retrieve information about an Item"
            },
            "/item/remove": {
                "anchor": "#itemremove",
                "description": "Remove an Item from your account"
            },
            "/item/webhook/update": {
                "anchor": "#itemwebhookupdate",
                "description": "Update the webhook associated with an Item"
            },
            "/item/public_token/exchange": {
                "anchor": "#itempublic_tokenexchange",
                "description": "Exchange a public_token for an access_token"
            },
            "/item/access_token/invalidate": {
                "anchor": "#itemaccess_tokeninvalidate",
                "description": "Invalidate access_token and generate new one"
            }
        },
        "request_fields": {
            # Common request fields across endpoints
            "client_id": "#item-get-request-client-id",
            "secret": "#item-get-request-secret",
            "access_token": "#item-get-request-access-token",
            
            # /item/public_token/exchange specific
            "public_token": "#item-public_token-exchange-request-public-token",
            
            # /item/webhook/update specific  
            "webhook": "#item-webhook-update-request-webhook"
        },
        "response_fields": {
            # Common response fields
            "request_id": "#item-get-response-request-id",
            
            # /item/get response - comprehensive item object
            "item": "#item-get-response-item",
            "item_id": "#item-get-response-item-item-id",
            "institution_id": "#item-get-response-item-institution-id",
            "institution_name": "#item-get-response-item-institution-name",
            "webhook": "#item-get-response-item-webhook",
            "auth_method": "#item-get-response-item-auth-method",
            "available_products": "#item-get-response-item-available-products",
            "billed_products": "#item-get-response-item-billed-products",
            "products": "#item-get-response-item-products",
            "consented_products": "#item-get-response-item-consented-products",
            "consent_expiration_time": "#item-get-response-item-consent-expiration-time",
            "update_type": "#item-get-response-item-update-type",
            "created_at": "#item-get-response-item-created-at",
            "consented_use_cases": "#item-get-response-item-consented-use-cases",
            "consented_data_scopes": "#item-get-response-item-consented-data-scopes",
            
            # Item error object
            "error": "#item-get-response-item-error",
            "error_type": "#item-get-response-item-error-error-type",
            "error_code": "#item-get-response-item-error-error-code",
            "error_code_reason": "#item-get-response-item-error-error-code-reason",
            "error_message": "#item-get-response-item-error-error-message",
            "display_message": "#item-get-response-item-error-display-message",
            "error_request_id": "#item-get-response-item-error-request-id",
            "causes": "#item-get-response-item-error-causes",
            "status": "#item-get-response-item-error-status",
            "documentation_url": "#item-get-response-item-error-documentation-url",
            "suggested_action": "#item-get-response-item-error-suggested-action",
            
            # Status object fields
            "status": "#item-get-response-status",
            "investments": "#item-get-response-status-investments",
            "last_successful_update": "#item-get-response-status-investments-last-successful-update",
            "last_failed_update": "#item-get-response-status-investments-last-failed-update",
            "transactions": "#item-get-response-status-transactions",
            "liabilities": "#item-get-response-status-liabilities",
            "identity": "#item-get-response-status-identity",
            "assets": "#item-get-response-status-assets",
            
            # /item/public_token/exchange response
            "access_token": "#item-public_token-exchange-response-access-token",
            "exchange_item_id": "#item-public_token-exchange-response-item-id",
            
            # /item/access_token/invalidate response
            "new_access_token": "#item-access_token-invalidate-response-new-access-token"
        },
        "webhooks": {
            "ERROR": "#error",
            "LOGIN_REPAIRED": "#login_repaired", 
            "NEW_ACCOUNTS_AVAILABLE": "#new_accounts_available",
            "PENDING_DISCONNECT": "#pending_disconnect",
            "PENDING_EXPIRATION": "#pending_expiration",
            "USER_PERMISSION_REVOKED": "#user_permission_revoked",
            "USER_ACCOUNT_REVOKED": "#user_account_revoked",
            "WEBHOOK_UPDATE_ACKNOWLEDGED": "#webhook_update_acknowledged"
        },
        "keywords": ["item management", "item lifecycle", "public token", "access token", "webhook management", "item status", "institution connection", "item removal", "token exchange"]
    },
    
    # LINK API - Link token management and Link flow
    "link": {
        "base_url": "https://plaid.com/docs/api/link/",
        "endpoints": {
            "/link/token/create": {
                "anchor": "#link_tokencreate",
                "description": "Create a token for initializing a Link session"
            },
            "/link/token/get": {
                "anchor": "#link_tokenget", 
                "description": "Get the public token and other details about a completed Link session"
            },
            "/item/public_token/exchange": {
                "anchor": "#itempublic_tokenexchange",
                "description": "Exchange a public token for an access token"
            },
            "/sandbox/public_token/create": {
                "anchor": "#sandboxpublic_tokencreate",
                "description": "Create a public token without the Link flow (Sandbox only)"
            },
            "/sandbox/item/reset_login": {
                "anchor": "#sandboxitemreset_login",
                "description": "Force an Item into an error state (Sandbox only)"
            },
            "/session/token/create": {
                "anchor": "#sessiontokencreate",
                "description": "Create a session (Layer only)"
            }
        },
        "request_fields": {
            # /link/token/create request fields
            "client_id": "#link-token-create-request-client-id",
            "secret": "#link-token-create-request-secret",
            "client_name": "#link-token-create-request-client-name",
            "country_codes": "#link-token-create-request-country-codes",
            "language": "#link-token-create-request-language",
            "user": "#link-token-create-request-user",
            "user_client_user_id": "#link-token-create-request-user-client-user-id",
            "user_legal_name": "#link-token-create-request-user-legal-name",
            "user_name": "#link-token-create-request-user-name",
            "user_given_name": "#link-token-create-request-user-given-name",
            "user_family_name": "#link-token-create-request-user-family-name",
            "user_email_address": "#link-token-create-request-user-email-address",
            "user_phone_number": "#link-token-create-request-user-phone-number",
            "user_phone_number_verified_time": "#link-token-create-request-user-phone-number-verified-time",
            "user_email_address_verified_time": "#link-token-create-request-user-email-address-verified-time",
            "user_ssn": "#link-token-create-request-user-ssn",
            "user_date_of_birth": "#link-token-create-request-user-date-of-birth",
            "user_address": "#link-token-create-request-user-address",
            "user_id_number": "#link-token-create-request-user-id-number",
            "products": "#link-token-create-request-products",
            "webhook": "#link-token-create-request-webhook",
            "access_token": "#link-token-create-request-access-token",
            "link_customization_name": "#link-token-create-request-link-customization-name",
            "redirect_uri": "#link-token-create-request-redirect-uri",
            "android_package_name": "#link-token-create-request-android-package-name",
            "account_filters": "#link-token-create-request-account-filters",
            "eu_config": "#link-token-create-request-eu-config",
            "institution_id": "#link-token-create-request-institution-id",
            "payment_initiation": "#link-token-create-request-payment-initiation",
            "deposit_switch": "#link-token-create-request-deposit-switch",
            "income_verification": "#link-token-create-request-income-verification",
            "auth": "#link-token-create-request-auth",
            "transactions": "#link-token-create-request-transactions",
            "identity_verification": "#link-token-create-request-identity-verification",
            "investments": "#link-token-create-request-investments",
            "investments_auth": "#link-token-create-request-investments-auth",
            "liabilities": "#link-token-create-request-liabilities",
            "consumer_report": "#link-token-create-request-consumer-report",
            
            # /link/token/get request fields
            "link_token": "#link-token-get-request-link-token",
            
            # /link/events/get request fields
            "start_date": "#link-events-get-request-start-date",
            "end_date": "#link-events-get-request-end-date",
            "count": "#link-events-get-request-count",
            "cursor": "#link-events-get-request-cursor",
            "filter": "#link-events-get-request-filter",
            
            # /link_delivery/create request fields
            "link_delivery_recipient": "#link-delivery-create-request-link-delivery-recipient",
            "link_delivery_delivery_method": "#link-delivery-create-request-link-delivery-delivery-method",
            "link_delivery_completion_redirect_uri": "#link-delivery-create-request-link-delivery-completion-redirect-uri",
            "link_delivery_session_id": "#link-delivery-create-request-link-delivery-session-id",
            
            # /link/oauth/correlation_id/destroy request fields
            "oauth_correlation_id": "#link-oauth-correlation-id-destroy-request-oauth-correlation-id"
        },
        "response_fields": {
            # /link/token/create response fields
            "link_token": "#link-token-create-response-link-token",
            "expiration": "#link-token-create-response-expiration",
            "request_id": "#link-token-create-response-request-id",
            
            # /link/token/get response fields
            "metadata": "#link-token-get-response-metadata",
            "metadata_initial_products": "#link-token-get-response-metadata-initial-products",
            "metadata_webhook": "#link-token-get-response-metadata-webhook",
            "metadata_country_codes": "#link-token-get-response-metadata-country-codes",
            "metadata_language": "#link-token-get-response-metadata-language",
            "metadata_account_filters": "#link-token-get-response-metadata-account-filters",
            "metadata_redirect_uri": "#link-token-get-response-metadata-redirect-uri",
            "metadata_client_name": "#link-token-get-response-metadata-client-name",
            "created_at": "#link-token-get-response-created-at",
            
            # /link/events/get response fields
            "events": "#link-events-get-response-events",
            "event_name": "#link-events-get-response-events-event-name",
            "event_id": "#link-events-get-response-events-event-id",
            "timestamp": "#link-events-get-response-events-timestamp",
            "institution_id": "#link-events-get-response-events-institution-id",
            "institution_name": "#link-events-get-response-events-institution-name",
            "institution_search_query": "#link-events-get-response-events-institution-search-query",
            "link_session_id": "#link-events-get-response-events-link-session-id",
            "mfa_type": "#link-events-get-response-events-mfa-type",
            "selection": "#link-events-get-response-events-selection",
            "view_name": "#link-events-get-response-events-view-name",
            "error_type": "#link-events-get-response-events-error-type",
            "error_code": "#link-events-get-response-events-error-code",
            "error_message": "#link-events-get-response-events-error-message",
            "exit_status": "#link-events-get-response-events-exit-status",
            "request_id": "#link-events-get-response-events-request-id",
            "next_cursor": "#link-events-get-response-next-cursor",
            
            # /link_delivery/create response fields
            "link_delivery_session_id": "#link-delivery-create-response-link-delivery-session-id",
            "link_delivery_url": "#link-delivery-create-response-link-delivery-url",
            
            # /link_delivery/get response fields
            "link_delivery_session": "#link-delivery-get-response-link-delivery-session",
            "link_delivery_status": "#link-delivery-get-response-link-delivery-session-status",
            "completion_metadata": "#link-delivery-get-response-link-delivery-session-completion-metadata",
            
            # /link/oauth/correlation_id/destroy response
            "destroyed": "#link-oauth-correlation-id-destroy-response-destroyed"
        },
        "webhooks": {
            "ITEM_ADD_RESULT": "#item_add_result",
            "EVENTS": "#events",
            "SESSION_FINISHED": "#session_finished"
        },
        "keywords": ["link token", "link flow", "link initialization", "link customization", "link events", "link delivery", "oauth", "user onboarding", "institution selection", "account connection"]
    },
    
    # SIGNAL API - Risk assessment and fraud detection  
    "signal": {
        "base_url": "https://plaid.com/docs/api/products/signal/",
        "endpoints": {
            "/signal/evaluate": {
                "anchor": "#signalevaluate",
                "description": "Evaluate return risk for ACH transactions"
            },
            "/signal/decision/report": {
                "anchor": "#signaldecisionreport",
                "description": "Report the outcome of a transaction"
            },
            "/signal/return/report": {
                "anchor": "#signalreturnreport", 
                "description": "Report returned transactions"
            },
            "/signal/prepare": {
                "anchor": "#signalprepare",
                "description": "Prepare for Signal evaluation"
            }
        },
        "request_fields": {
            # /signal/evaluate request fields
            "client_id": "#signal-evaluate-request-client-id",
            "secret": "#signal-evaluate-request-secret",
            "access_token": "#signal-evaluate-request-access-token",
            "account_id": "#signal-evaluate-request-account-id",
            "client_transaction_id": "#signal-evaluate-request-client-transaction-id",
            "amount": "#signal-evaluate-request-amount",
            "user_present": "#signal-evaluate-request-user-present",
            "client_user_id": "#signal-evaluate-request-client-user-id",
            "is_recurring": "#signal-evaluate-request-is-recurring",
            "default_payment_method": "#signal-evaluate-request-default-payment-method",
            
            # User nested object fields
            "user": "#signal-evaluate-request-user",
            "user_name": "#signal-evaluate-request-user-name",
            "prefix": "#signal-evaluate-request-user-name-prefix",
            "given_name": "#signal-evaluate-request-user-name-given-name",
            "middle_name": "#signal-evaluate-request-user-name-middle-name",
            "family_name": "#signal-evaluate-request-user-name-family-name",
            "suffix": "#signal-evaluate-request-user-name-suffix",
            "phone_number": "#signal-evaluate-request-user-phone-number",
            "email_address": "#signal-evaluate-request-user-email-address",
            "user_address": "#signal-evaluate-request-user-address",
            "user_city": "#signal-evaluate-request-user-address-city",
            "user_region": "#signal-evaluate-request-user-address-region",
            "user_street": "#signal-evaluate-request-user-address-street",
            "user_postal_code": "#signal-evaluate-request-user-address-postal-code",
            "user_country": "#signal-evaluate-request-user-address-country",
            
            # Device nested object fields  
            "device": "#signal-evaluate-request-device",
            "ip_address": "#signal-evaluate-request-device-ip-address",
            "user_agent": "#signal-evaluate-request-device-user-agent"
        },
        "response_fields": {
            # /signal/evaluate response fields
            "request_id": "#signal-evaluate-response-request-id",
            "scores": "#signal-evaluate-response-scores",
            "customer_initiated_return_risk": "#signal-evaluate-response-scores-customer-initiated-return-risk",
            "bank_initiated_return_risk": "#signal-evaluate-response-scores-bank-initiated-return-risk",
            "score": "#signal-evaluate-response-scores-customer-initiated-return-risk-score",
            "bank_score": "#signal-evaluate-response-scores-bank-initiated-return-risk-score",
            
            # Core attributes
            "core_attributes": "#signal-evaluate-response-core-attributes",
            "days_since_first_plaid_connection": "#signal-evaluate-response-core-attributes-days-since-first-plaid-connection",
            "plaid_connections_count_7d": "#signal-evaluate-response-core-attributes-plaid-connections-count-7d", 
            "plaid_connections_count_30d": "#signal-evaluate-response-core-attributes-plaid-connections-count-30d",
            "total_plaid_connections_count": "#signal-evaluate-response-core-attributes-total-plaid-connections-count",
            "is_savings_or_money_market_account": "#signal-evaluate-response-core-attributes-is-savings-or-money-market-account",
            
            # Ruleset fields
            "ruleset": "#signal-evaluate-response-ruleset",
            "ruleset_key": "#signal-evaluate-response-ruleset-ruleset-key",
            "result": "#signal-evaluate-response-ruleset-result",
            "triggered_rule_details": "#signal-evaluate-response-ruleset-triggered-rule-details",
            
            # Warnings
            "warnings": "#signal-evaluate-response-warnings"
        },
        "webhooks": {
            "SIGNAL_PREPARE_COMPLETE": "#signal_prepare_complete"
        },
        "keywords": ["risk assessment", "fraud detection", "ACH returns", "transaction risk", "return probability", "bank risk", "customer risk", "signal evaluation", "risk scoring"]
    },
    
    # CRA CHECK API - Consumer reporting and base reports
    "cra_check": {
        "base_url": "https://plaid.com/docs/api/products/check/",
        "general_docs_url": "https://plaid.com/docs/check/",
        "endpoints": {
            "/cra/check_report/create": {
                "anchor": "#cracheck_reportcreate",
                "description": "Create a Consumer Report for CRA use cases"
            },
            "/cra/check_report/base_report/get": {
                "anchor": "#cracheck_reportbase_reportget",
                "description": "Retrieve the Base Report component of a Consumer Report"
            },
            "/cra/check_report/income_insights/get": {
                "anchor": "#cracheck_reportincome_insightsget",
                "description": "Retrieve cash flow insights from user's banks"
            },
            "/cra/check_report/network_insights/get": {
                "anchor": "#cracheck_reportnetwork_insightsget",
                "description": "Retrieve connection insights from Plaid network (beta)"
            },
            "/cra/check_report/partner_insights/get": {
                "anchor": "#cracheck_reportpartner_insightsget",
                "description": "Retrieve Partner Insights (requires Prism partnership)"
            },
            "/cra/check_report/pdf/get": {
                "anchor": "#cracheck_reportpdfget",
                "description": "Retrieve a PDF version of the Consumer Report"
            },
            "/cra/monitoring_insights/get": {
                "anchor": "#cramonitoring_insightsget",
                "description": "Get Cash Flow Updates (beta)"
            },
            "/cra/monitoring_insights/subscribe": {
                "anchor": "#cramonitoring_insightssubscribe",
                "description": "Subscribe to Cash Flow Updates (beta)"
            },
            "/cra/monitoring_insights/unsubscribe": {
                "anchor": "#cramonitoring_insightsunsubscribe",
                "description": "Unsubscribe from Cash Flow Updates (beta)"
            }
        },
        "request_fields": {
            # /cra/check_report/create request fields
            "client_id": "#cra-check-report-create-request-client-id",
            "secret": "#cra-check-report-create-request-secret",
            "user_token": "#cra-check-report-create-request-user-token",
            "webhook": "#cra-check-report-create-request-webhook",
            "days_requested": "#cra-check-report-create-request-days-requested",
            "consumer_report_permissible_purpose": "#cra-check-report-create-request-consumer-report-permissible-purpose",
            
            # Partner insights configuration
            "prism_products": "#cra-check-report-create-request-prism-products",
            "prism_versions": "#cra-check-report-create-request-prism-versions",
            "firstdetect": "#cra-check-report-create-request-prism-versions-firstdetect",
            "detect": "#cra-check-report-create-request-prism-versions-detect",
            "cashscore": "#cra-check-report-create-request-prism-versions-cashscore",
            "extend": "#cra-check-report-create-request-prism-versions-extend",
            "insights": "#cra-check-report-create-request-prism-versions-insights",
            
            # Base report get request fields
            "user_token_get": "#cra-check-base-report-get-request-user-token",
            
            # Income insights request fields
            "user_token_income": "#cra-check-income-insights-get-request-user-token",
            
            # Network insights request fields
            "user_token_network": "#cra-check-network-insights-get-request-user-token",
            
            # Monitoring insights request fields
            "user_token_monitoring": "#cra-monitoring-insights-get-request-user-token",
            "start_date": "#cra-monitoring-insights-get-request-start-date",
            "end_date": "#cra-monitoring-insights-get-request-end-date",
            
            # Subscribe/unsubscribe request fields
            "insights_webhooks": "#cra-monitoring-insights-subscribe-request-insights-webhooks",
            "webhook_url": "#cra-monitoring-insights-subscribe-request-webhook-url"
        },
        "response_fields": {
            # Top-level report metadata
            "report": "#cra-check-base-report-get-response-report",
            "report_id": "#cra-check-base-report-get-response-report-report-id",
            "date_generated": "#cra-check-base-report-get-response-report-date-generated",
            "days_requested": "#cra-check-base-report-get-response-report-days-requested",
            "client_report_id": "#cra-check-base-report-get-response-report-client-report-id",
            "items": "#cra-check-base-report-get-response-report-items",
            
            # Items array fields
            "institution_name": "#cra-check-base-report-get-response-report-items-institution-name",
            "institution_id": "#cra-check-base-report-get-response-report-items-institution-id",
            "date_last_updated": "#cra-check-base-report-get-response-report-items-date-last-updated",
            "item_id": "#cra-check-base-report-get-response-report-items-item-id",
            "accounts": "#cra-check-base-report-get-response-report-items-accounts",
            
            # Account fields
            "account_id": "#cra-check-base-report-get-response-report-items-accounts-account-id",
            "account_name": "#cra-check-base-report-get-response-report-items-accounts-name",
            "account_type": "#cra-check-base-report-get-response-report-items-accounts-type",
            "account_subtype": "#cra-check-base-report-get-response-report-items-accounts-subtype",
            "balances": "#cra-check-base-report-get-response-report-items-accounts-balances",
            "available": "#cra-check-base-report-get-response-report-items-accounts-balances-available",
            "current": "#cra-check-base-report-get-response-report-items-accounts-balances-current",
            "limit": "#cra-check-base-report-get-response-report-items-accounts-balances-limit",
            "average_balance": "#cra-check-base-report-get-response-report-items-accounts-balances-average-balance",
            "average_monthly_balances": "#cra-check-base-report-get-response-report-items-accounts-balances-average-monthly-balances",
            
            # Transaction fields
            "transactions": "#cra-check-base-report-get-response-report-items-accounts-transactions",
            "transaction_id": "#cra-check-base-report-get-response-report-items-accounts-transactions-transaction-id",
            "amount": "#cra-check-base-report-get-response-report-items-accounts-transactions-amount",
            "date": "#cra-check-base-report-get-response-report-items-accounts-transactions-date",
            "merchant_name": "#cra-check-base-report-get-response-report-items-accounts-transactions-merchant-name",
            "pending": "#cra-check-base-report-get-response-report-items-accounts-transactions-pending",
            "credit_category": "#cra-check-base-report-get-response-report-items-accounts-transactions-credit-category",
            
            # Owners fields
            "owners": "#cra-check-base-report-get-response-report-items-accounts-owners",
            "owner_names": "#cra-check-base-report-get-response-report-items-accounts-owners-names",
            "owner_phone_numbers": "#cra-check-base-report-get-response-report-items-accounts-owners-phone-numbers",
            "owner_emails": "#cra-check-base-report-get-response-report-items-accounts-owners-emails",
            "owner_addresses": "#cra-check-base-report-get-response-report-items-accounts-owners-addresses",
            "ownership_type": "#cra-check-base-report-get-response-report-items-accounts-owners-ownership-type",
            
            # Legacy fields (deprecated)
            "account_insights": "#cra-check-base-report-get-response-report-items-accounts-account-insights",
            
            # Income insights response fields
            "income_insights": "#cra-check-income-insights-get-response-income-insights",
            "income_summary": "#cra-check-income-insights-get-response-income-summary",
            "average_monthly_income": "#cra-check-income-insights-get-response-average-monthly-income",
            "income_frequency": "#cra-check-income-insights-get-response-income-frequency",
            
            # Network insights response fields
            "network_insights": "#cra-check-network-insights-get-response-network-insights",
            "connection_score": "#cra-check-network-insights-get-response-connection-score",
            "network_strength": "#cra-check-network-insights-get-response-network-strength",
            
            # Monitoring insights response fields
            "monitoring_insights": "#cra-monitoring-insights-get-response-monitoring-insights",
            "cash_flow_updates": "#cra-monitoring-insights-get-response-cash-flow-updates",
            "balance_alerts": "#cra-monitoring-insights-get-response-balance-alerts",
            "transaction_alerts": "#cra-monitoring-insights-get-response-transaction-alerts"
        },
        "webhooks": {
            "CRA_CHECK_REPORT_READY": "#cra_check_report_ready",
            "CRA_CHECK_REPORT_ERROR": "#cra_check_report_error",
            "INSIGHTS_UPDATED": "#insights_updated",
            "LARGE_DEPOSIT_DETECTED": "#large_deposit_detected",
            "LOW_BALANCE_DETECTED": "#low_balance_detected",
            "NEW_LOAN_PAYMENT_DETECTED": "#new_loan_payment_detected",
            "NSF_OVERDRAFT_DETECTED": "#nsf_overdraft_detected"
        },
        "keywords": ["consumer reporting", "CRA", "base report", "credit reporting", "financial report", "account analysis", "transaction history", "prism insights", "partner insights", "consumer report agency", "consumer report", "plaid check", "check", "income insights", "network insights", "cash flow", "monitoring", "large deposit", "low balance", "NSF", "overdraft", "loan payment"]
    },
    
    # TRANSFER API - Money movement and ACH transfers
    "transfer": {
        "base_url": "https://plaid.com/docs/api/products/transfer/",
        "endpoints": {
            # Transfer initiation
            "/transfer/authorization/create": {
                "anchor": "#transferauthorizationcreate",
                "description": "Create a transfer authorization"
            },
            "/transfer/authorization/cancel": {
                "anchor": "#transferauthorizationcancel",
                "description": "Cancel a transfer authorization"
            },
            "/transfer/create": {
                "anchor": "#transfercreate",
                "description": "Create a transfer"
            },
            "/transfer/cancel": {
                "anchor": "#transfercancel",
                "description": "Cancel a transfer"
            },
            
            # Reading transfers
            "/transfer/get": {
                "anchor": "#transferget",
                "description": "Retrieve information about a transfer"
            },
            "/transfer/list": {
                "anchor": "#transferlist",
                "description": "Retrieve a list of transfers and their statuses"
            },
            "/transfer/event/list": {
                "anchor": "#transfereventlist",
                "description": "Retrieve a list of transfer events"
            },
            "/transfer/event/sync": {
                "anchor": "#transfereventsync",
                "description": "Sync transfer events"
            },
            
            # Account linking and capabilities
            "/transfer/capabilities/get": {
                "anchor": "#transfercapabilitiesget",
                "description": "Get account transfer capabilities"
            },
            "/transfer/intent/create": {
                "anchor": "#transferintentcreate",
                "description": "Create a transfer intent and invoke Transfer UI"
            },
            "/transfer/intent/get": {
                "anchor": "#transferintentget",
                "description": "Retrieve information about a transfer intent"
            },
            
            # Recurring transfers
            "/transfer/recurring/create": {
                "anchor": "#transferrecurringcreate",
                "description": "Create a recurring transfer"
            },
            "/transfer/recurring/cancel": {
                "anchor": "#transferrecurringcancel",
                "description": "Cancel a recurring transfer"
            },
            "/transfer/recurring/get": {
                "anchor": "#transferrecurringget",
                "description": "Retrieve a recurring transfer"
            },
            "/transfer/recurring/list": {
                "anchor": "#transferrecurringlist",
                "description": "List recurring transfers"
            },
            
            # Refunds
            "/transfer/refund/create": {
                "anchor": "#transferrefundcreate",
                "description": "Create a refund for a transfer"
            },
            "/transfer/refund/cancel": {
                "anchor": "#transferrefundcancel",
                "description": "Cancel a refund"
            },
            "/transfer/refund/get": {
                "anchor": "#transferrefundget",
                "description": "Retrieve information about a refund"
            },
            
            # Configuration and ledger
            "/transfer/configuration/get": {
                "anchor": "#transferconfigurationget",
                "description": "Get transfer product configuration"
            },
            "/transfer/ledger/get": {
                "anchor": "#transferledgerget",
                "description": "Retrieve information about the ledger balance held with Plaid"
            }
        },
        "request_fields": {
            # Common request fields
            "client_id": "#transfer-create-request-client-id",
            "secret": "#transfer-create-request-secret",
            "access_token": "#transfer-create-request-access-token",
            
            # Transfer creation fields
            "amount": "#transfer-create-request-amount",
            "account_id": "#transfer-create-request-account-id",
            "funding_account_id": "#transfer-create-request-funding-account-id",
            "type": "#transfer-create-request-type",
            "network": "#transfer-create-request-network",
            "ach_class": "#transfer-create-request-ach-class",
            "description": "#transfer-create-request-description",
            "client_user_id": "#transfer-create-request-client-user-id",
            
            # Authorization fields
            "authorization_id": "#transfer-authorization-create-request-authorization-id",
            "transfer_id": "#transfer-get-request-transfer-id",
            
            # User information
            "user": "#transfer-create-request-user",
            "legal_name": "#transfer-create-request-user-legal-name",
            "phone_number": "#transfer-create-request-user-phone-number",
            "email_address": "#transfer-create-request-user-email-address",
            "address": "#transfer-create-request-user-address",
            
            # Device information
            "device": "#transfer-create-request-device",
            "ip_address": "#transfer-create-request-device-ip-address",
            "user_agent": "#transfer-create-request-device-user-agent",
            
            # Recurring transfer fields
            "schedule": "#transfer-recurring-create-request-schedule",
            "interval_unit": "#transfer-recurring-create-request-schedule-interval-unit",
            "interval_count": "#transfer-recurring-create-request-schedule-interval-count",
            "start_date": "#transfer-recurring-create-request-schedule-start-date",
            "end_date": "#transfer-recurring-create-request-schedule-end-date",
            
            # Intent fields
            "intent_id": "#transfer-intent-create-request-intent-id",
            "mode": "#transfer-intent-create-request-mode",
            "iso_currency_code": "#transfer-intent-create-request-iso-currency-code"
        },
        "response_fields": {
            # Transfer object fields
            "transfer": "#transfer-get-response-transfer",
            "transfer_id": "#transfer-get-response-transfer-transfer-id",
            "status": "#transfer-get-response-transfer-status",
            "amount": "#transfer-get-response-transfer-amount",
            "type": "#transfer-get-response-transfer-type",
            "network": "#transfer-get-response-transfer-network",
            "ach_class": "#transfer-get-response-transfer-ach-class",
            "created": "#transfer-get-response-transfer-created",
            "account_id": "#transfer-get-response-transfer-account-id",
            "funding_account_id": "#transfer-get-response-transfer-funding-account-id",
            "description": "#transfer-get-response-transfer-description",
            "client_user_id": "#transfer-get-response-transfer-client-user-id",
            "failure_reason": "#transfer-get-response-transfer-failure-reason",
            "metadata": "#transfer-get-response-transfer-metadata",
            "origination_account_id": "#transfer-get-response-transfer-origination-account-id",
            "guarantee_decision": "#transfer-get-response-transfer-guarantee-decision",
            "guarantee_decision_rationale": "#transfer-get-response-transfer-guarantee-decision-rationale",
            
            # Authorization response fields
            "authorization": "#transfer-authorization-create-response-authorization",
            "authorization_id": "#transfer-authorization-create-response-authorization-authorization-id",
            "proposed_transfer": "#transfer-authorization-create-response-authorization-proposed-transfer",
            "decision": "#transfer-authorization-create-response-authorization-decision",
            "decision_rationale": "#transfer-authorization-create-response-authorization-decision-rationale",
            
            # Transfer lists and events
            "transfers": "#transfer-list-response-transfers",
            "transfer_events": "#transfer-event-list-response-transfer-events",
            "event_id": "#transfer-event-list-response-transfer-events-event-id",
            "timestamp": "#transfer-event-list-response-transfer-events-timestamp",
            "event_type": "#transfer-event-list-response-transfer-events-event-type",
            
            # Recurring transfers
            "recurring_transfer": "#transfer-recurring-get-response-recurring-transfer",
            "recurring_transfer_id": "#transfer-recurring-get-response-recurring-transfer-recurring-transfer-id",
            "schedule": "#transfer-recurring-get-response-recurring-transfer-schedule",
            "next_origination_date": "#transfer-recurring-get-response-recurring-transfer-next-origination-date",
            
            # Refund fields
            "refund": "#transfer-refund-get-response-refund",
            "refund_id": "#transfer-refund-get-response-refund-refund-id",
            "refund_amount": "#transfer-refund-get-response-refund-amount",
            
            # Configuration and capabilities
            "capabilities": "#transfer-capabilities-get-response-capabilities",
            "eligible_amount_range": "#transfer-capabilities-get-response-capabilities-eligible-amount-range",
            "configuration": "#transfer-configuration-get-response-configuration",
            "ledger_balance": "#transfer-ledger-get-response-ledger-balance",
            
            # Intent fields
            "intent": "#transfer-intent-get-response-intent",
            "intent_id": "#transfer-intent-get-response-intent-intent-id",
            "status": "#transfer-intent-get-response-intent-status",
            "account_id": "#transfer-intent-get-response-intent-account-id",
            "origination_account_id": "#transfer-intent-get-response-intent-origination-account-id"
        },
        "webhooks": {
            "TRANSFER_EVENTS_UPDATE": "#transfer_events_update",
            "RECURRING_CANCELLED": "#recurring_cancelled",
            "RECURRING_NEW_TRANSFER": "#recurring_new_transfer", 
            "RECURRING_TRANSFER_SKIPPED": "#recurring_transfer_skipped"
        },
        "keywords": ["money movement", "ACH transfers", "bank transfers", "payment processing", "transfer authorization", "recurring transfers", "refunds", "transfer intent", "same-day ACH", "next-day ACH", "standard ACH", "transfer events", "transfer capabilities"]
    },
    
    # BALANCE API - Real-time account balance information
    "balance": {
        "base_url": "https://plaid.com/docs/api/products/balance/",
        "endpoints": {
            "/accounts/balance/get": {
                "anchor": "#accountsbalanceget",
                "description": "Retrieve real-time account balance information"
            }
        },
        "request_fields": {
            # /accounts/balance/get request fields
            "client_id": "#accounts-balance-get-request-client-id",
            "secret": "#accounts-balance-get-request-secret",
            "access_token": "#accounts-balance-get-request-access-token",
            "options": "#accounts-balance-get-request-options",
            "account_ids": "#accounts-balance-get-request-options-account-ids",
            "min_last_updated_datetime": "#accounts-balance-get-request-options-min-last-updated-datetime"
        },
        "response_fields": {
            # Main response objects
            "accounts": "#accounts-balance-get-response-accounts",
            "item": "#accounts-balance-get-response-item",
            "request_id": "#accounts-balance-get-response-request-id",
            
            # Account details
            "account_id": "#accounts-balance-get-response-accounts-account-id",
            "balances": "#accounts-balance-get-response-accounts-balances",
            "available": "#accounts-balance-get-response-accounts-balances-available",
            "current": "#accounts-balance-get-response-accounts-balances-current",
            "limit": "#accounts-balance-get-response-accounts-balances-limit",
            "iso_currency_code": "#accounts-balance-get-response-accounts-balances-iso-currency-code",
            "unofficial_currency_code": "#accounts-balance-get-response-accounts-balances-unofficial-currency-code",
            "last_updated_datetime": "#accounts-balance-get-response-accounts-balances-last-updated-datetime",
            "mask": "#accounts-balance-get-response-accounts-mask",
            "name": "#accounts-balance-get-response-accounts-name",
            "official_name": "#accounts-balance-get-response-accounts-official-name",
            "type": "#accounts-balance-get-response-accounts-type",
            "subtype": "#accounts-balance-get-response-accounts-subtype",
            "verification_status": "#accounts-balance-get-response-accounts-verification-status",
            "persistent_account_id": "#accounts-balance-get-response-accounts-persistent-account-id",
            
            # Real-time balance specific fields
            "consent_expiration_time": "#accounts-balance-get-response-accounts-balances-consent-expiration-time",
            "real_time_classification": "#accounts-balance-get-response-accounts-balances-real-time-classification"
        },
        "webhooks": {
            "DEFAULT_UPDATE": "#default_update"
        },
        "keywords": ["account balance", "real-time balance", "current balance", "available balance", "balance inquiry", "account funds", "balance check", "real-time data"]
    },
    
    # LAYER API - Instant onboarding and user authentication
    "layer": {
        "base_url": "https://plaid.com/docs/api/products/layer/",
        "general_docs_url": "https://plaid.com/docs/layer/",
        "endpoints": {
            "/session/token/create": {
                "anchor": "#sessiontokencreate",
                "description": "Create a Link token for a Layer session"
            },
            "/user_account/session/get": {
                "anchor": "#useraccountsessionget",
                "description": "Returns user permissioned account data after Layer authentication"
            }
        },
        "request_fields": {
            # /session/token/create request fields
            "client_id": "#session-token-create-request-client-id",
            "secret": "#session-token-create-request-secret",
            "template_id": "#session-token-create-request-template-id",
            "user": "#session-token-create-request-user",
            "client_user_id": "#session-token-create-request-user-client-user-id",
            "user_id": "#session-token-create-request-user-user-id",
            "redirect_uri": "#session-token-create-request-user-redirect-uri",
            "webhook": "#session-token-create-request-user-webhook",
            
            # /user_account/session/get request fields
            "public_token": "#user-account-session-get-request-public-token"
        },
        "response_fields": {
            # Session token response fields
            "link_token": "#session-token-create-response-link-token",
            "expiration": "#session-token-create-response-expiration",
            
            # User account session response fields
            "identity": "#user-account-session-get-response-identity",
            "name": "#user-account-session-get-response-identity-name",
            "address": "#user-account-session-get-response-identity-address",
            "phone_number": "#user-account-session-get-response-identity-phone-number",
            "email": "#user-account-session-get-response-identity-email",
            "date_of_birth": "#user-account-session-get-response-identity-date-of-birth",
            "ssn": "#user-account-session-get-response-identity-ssn",
            "items": "#user-account-session-get-response-items",
            "item_id": "#user-account-session-get-response-items-item-id",
            "access_token": "#user-account-session-get-response-items-access-token"
        },
        "webhooks": {
            "LAYER_AUTHENTICATION_PASSED": "#layer_authentication_passed"
        },
        "keywords": ["layer", "instant onboarding", "user authentication", "identity verification", "simplified flow", "user identity", "account connection", "authentication flow", "onboarding", "session token", "user session"]
    }
}

# Field aliases - common terms that map to official field names
FIELD_ALIASES = {
    "routing": "routing_number",
    "account": "account_id", 
    "balance": "balances",
    "transaction": "transaction_id",
    "merchant": "merchant_name",
    "category": "category",
    "amount": "amount",
    "name": "names",
    "email": "emails",
    "phone": "phone_numbers", 
    "address": "addresses",
    # Common dotted field patterns
    "latitude": "lat",
    "longitude": "lon",
    "postal": "postal_code",
    "zip": "postal_code",
    "state": "region"
}

# Keyword to product mapping
KEYWORD_TO_PRODUCT = {}
for product, config in PLAID_API_INDEX.items():
    for keyword in config.get("keywords", []):
        if keyword not in KEYWORD_TO_PRODUCT:
            KEYWORD_TO_PRODUCT[keyword] = []
        KEYWORD_TO_PRODUCT[keyword].append(product)

def find_endpoint_url(endpoint: str, product_hint: str = None) -> str:
    """
    Find the documentation URL for a specific API endpoint
    
    Args:
        endpoint: The endpoint to look up (e.g., "/auth/get", "/transactions/sync")
        product_hint: Optional product context (e.g., "auth", "transactions")
    
    Returns:
        Full URL to the endpoint documentation
    """
    # If product hint provided, search there first
    if product_hint and product_hint in PLAID_API_INDEX:
        product_config = PLAID_API_INDEX[product_hint]
        if endpoint in product_config.get("endpoints", {}):
            anchor = product_config["endpoints"][endpoint]["anchor"]
            return f"{product_config['base_url']}{anchor}"
    
    # Search all products
    for product, config in PLAID_API_INDEX.items():
        if endpoint in config.get("endpoints", {}):
            anchor = config["endpoints"][endpoint]["anchor"]
            return f"{config['base_url']}{anchor}"
    
    # If no endpoint found, return general docs
    return "https://plaid.com/docs/api/"

def find_field_url(field_name: str, product_hint: str = None, field_type: str = "response") -> str:
    """
    Find the documentation URL for a specific field
    
    Args:
        field_name: The field to look up (e.g., "routing", "account_id", "cursor", "location.lat")
        product_hint: Optional product context (e.g., "auth", "transactions")
        field_type: Type of field - "request" or "response" (default: "response")
    
    Returns:
        Full URL to the field documentation
    """
    # Handle dotted field references (e.g., "location.lat" -> "lat")
    # Extract the last part for lookup while preserving original for fallback
    original_field = field_name
    if "." in field_name:
        field_name = field_name.split(".")[-1]  # Get last part (e.g., "lat" from "location.lat")
    
    # Normalize field name
    normalized_field = FIELD_ALIASES.get(field_name.lower(), field_name.lower())
    field_section = f"{field_type}_fields"
    
    # If product hint provided, search there first
    if product_hint and product_hint in PLAID_API_INDEX:
        product_config = PLAID_API_INDEX[product_hint]
        if normalized_field in product_config.get(field_section, {}):
            anchor = product_config[field_section][normalized_field]
            return f"{product_config['base_url']}{anchor}"
    
    # Search all products for this field
    for product, config in PLAID_API_INDEX.items():
        if normalized_field in config.get(field_section, {}):
            anchor = config[field_section][normalized_field]
            return f"{config['base_url']}{anchor}"
    
    # Try the other field type if not found
    other_field_type = "request_fields" if field_type == "response" else "response_fields"
    if product_hint and product_hint in PLAID_API_INDEX:
        product_config = PLAID_API_INDEX[product_hint]
        if normalized_field in product_config.get(other_field_type, {}):
            anchor = product_config[other_field_type][normalized_field]
            return f"{product_config['base_url']}{anchor}"
    
    # Search all products for other field type
    for product, config in PLAID_API_INDEX.items():
        if normalized_field in config.get(other_field_type, {}):
            anchor = config[other_field_type][normalized_field]
            return f"{config['base_url']}{anchor}"
    
    # If dotted field wasn't found, try searching for the full original field name
    if "." in original_field:
        # Try exact match with original dotted field name
        if product_hint and product_hint in PLAID_API_INDEX:
            product_config = PLAID_API_INDEX[product_hint]
            if original_field.lower() in product_config.get(field_section, {}):
                anchor = product_config[field_section][original_field.lower()]
                return f"{product_config['base_url']}{anchor}"
        
        # Search all products for original dotted field name
        for product, config in PLAID_API_INDEX.items():
            if original_field.lower() in config.get(field_section, {}):
                anchor = config[field_section][original_field.lower()]
                return f"{config['base_url']}{anchor}"
    
    # If no specific field found, return base product URL or general docs
    if product_hint and product_hint in PLAID_API_INDEX:
        return PLAID_API_INDEX[product_hint]["base_url"]
    
    return "https://plaid.com/docs/api/"

def find_product_from_keywords(text: str) -> list:
    """
    Identify relevant Plaid products based on keywords in text
    
    Args:
        text: Text to analyze for product keywords
    
    Returns:
        List of relevant product names
    """
    text_lower = text.lower()
    relevant_products = set()
    
    for keyword, products in KEYWORD_TO_PRODUCT.items():
        if keyword in text_lower:
            relevant_products.update(products)
    
    return list(relevant_products)

def get_field_documentation_url(field_name: str, api_context: str = "transactions") -> str:
    """
    Convenience function to get documentation URL for any field, including dotted fields
    
    Args:
        field_name: Field name (e.g., "location.lat", "amount", "personal_finance_category.primary")
        api_context: API context for better lookup (default: "transactions")
    
    Returns:
        Documentation URL for the field
    
    Examples:
        get_field_documentation_url("location.lat") 
        # Returns: https://plaid.com/docs/api/products/transactions/#transactions-sync-response-added-location-lat
        
        get_field_documentation_url("personal_finance_category.primary")
        # Returns: https://plaid.com/docs/api/products/transactions/#transactions-sync-response-added-personal-finance-category-primary
    """
    return find_field_url(field_name, api_context, "response")

# Usage examples for testing
if __name__ == "__main__":
    # Test endpoint lookups
    print("Testing endpoint lookups:")
    print(f"/auth/get: {find_endpoint_url('/auth/get')}")
    print(f"/transactions/sync: {find_endpoint_url('/transactions/sync')}")
    print(f"/investments/holdings/get: {find_endpoint_url('/investments/holdings/get')}")
    
    # Test field lookups
    print("\nTesting field lookups:")
    print(f"routing (response): {find_field_url('routing', 'auth', 'response')}")
    print(f"cursor (request): {find_field_url('cursor', 'transactions', 'request')}")
    print(f"security_id (response): {find_field_url('security_id', 'investments', 'response')}")
    print(f"account_id (request): {find_field_url('account_id', 'auth', 'request')}")
    
    # Test cross-field type lookup
    print(f"access_token (auto-detect): {find_field_url('access_token')}")
    
    # Test dotted field lookups (NEW!)
    print("\nTesting dotted field lookups:")
    print(f"location.lat (transactions): {find_field_url('location.lat', 'transactions', 'response')}")
    print(f"location.lon (transactions): {find_field_url('location.lon', 'transactions', 'response')}")
    print(f"location.address (transactions): {find_field_url('location.address', 'transactions', 'response')}")
    print(f"personal_finance_category.primary (transactions): {find_field_url('personal_finance_category.primary', 'transactions', 'response')}")
    print(f"personal_finance_category.detailed (transactions): {find_field_url('personal_finance_category.detailed', 'transactions', 'response')}")
    
    # Test keyword detection
    print(f"\nKeyword detection for 'routing number verification': {find_product_from_keywords('routing number verification')}")
    print(f"Keyword detection for 'investment portfolio': {find_product_from_keywords('investment portfolio')}")
    print(f"Keyword detection for 'transaction sync': {find_product_from_keywords('transaction sync')}")