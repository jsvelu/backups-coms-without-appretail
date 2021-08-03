
set foreign_key_checks = 0;

insert into qa_category (qa_category_id, title, weight) select qa_category_id, category_name, weight from newage_alldata.qa_categories;
insert into qa_prod_category (qa_prod_category_id, title, weight) select qa_prod_category_id, category_name, weight from newage_alldata.qa_prod_categories;

insert into lead (lead_id, name, message, notes, phone, email, state_id, sales_user, model_id, lead_status_id, lead_source_id, lead_first_heard_id, created, reminder_date) select
lead_id, lead_name, lead_message, lead_notes, lead_phone, lead_email, 1, lead_sales_user, 1, lead_status_id, 1, 1, lead_created, lead_reminder_date from newage_alldata.leads;

insert into lead_first_heard (lead_first_heard_id, first_heard, cost_per_week) select lead_first_herd_id, lead_first_herd, cost_per_week from newage_alldata.leads_first_herd;
update lead l join newage_alldata.leads ol on ol.lead_id = l.lead_id set l.lead_first_heard_id = (select lead_first_heard_id from lead_first_heard where first_heard = ol.lead_first_herd limit 1);

insert into item_rule select * from newage_alldata.item_rules;
insert into rule select * from newage_alldata.rules;
insert into newage_sales.option select NULL, opts.key, opts.value from newage_alldata.options opts;

insert into qa_item select * from newage_alldata.qa_items;
insert into qa_item_missing select * from newage_alldata.qa_items_missing;
insert into qa_order_item select * from newage_alldata.qa_prod_order_items;
insert into qa_prod_order_item select * from newage_alldata.qa_prod_order_items;
insert into qa_prod_item select * from newage_alldata.qa_prod_items;

insert into newage_sales.user (id, full_name, username, password, password_expiry, user_level_id, dealership_id, email, twitter, dealer_name, is_draft_person)
select id, full_name, username, password, password_expiry, 1, dealership_id, email, twitter, dealer_name, is_draft_person from newage_alldata.users;

insert into lead_status (status_id, title) select status_id, status_name from newage_alldata.leads_status;

set foreign_key_checks = 1;



