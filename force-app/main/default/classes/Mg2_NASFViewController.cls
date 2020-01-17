public with sharing class Mg2_NASFViewController {
    public List<PDFItem> asf { get; set; }
    public Id accountId { get; private set; }

    public Mbr_Group__c filterGroup { get; set; }
    public Set<Id> selectedGroupIds { get; set; }
    public String currDateTime { get; set; }
    //private Boolean isValid {get; set;}
    public Boolean showGroupSelect { get; set; }
    public String renderMode {get; set;}
    public String version { get; set; }
	
        
    public Mg2_NASFViewController() {
        PageReference page = System.currentPageReference();

        // First time setup
        filterGroup = new Mbr_Group__c();
        accountId = page.getParameters().get('aid');
        String render = apexpages.currentpage().getparameters().get('renderAs');       	        
        renderMode = render;
               
        showGroupSelect = true;
        currDateTime = String.valueOf(DateTime.now());

        selectedGroupIds = new Set<Id>();
		
        // Get latest version from Metadata
        NASF_Metadata__mdt md = [
                SELECT Id, Value__c,Label
                FROM NASF_Metadata__mdt
                WHERE Label = 'NASF Version'
        ];
        version = md.Value__c;

        Cookie idCookie = page.getCookies().get('g:' + accountId);
        
        
        
        String idValString;       
        idValString = apexpages.currentpage().getparameters().get('Mbr_Group__c');
        
        if(idValString == null){           
            if (idCookie == null) {
                
                idValString = page.getParameters().get('ids');
            } else {
                idValString = idCookie.getValue();
            }
        }
        

        if (!String.isBlank(idValString)) {
            for (String s : idValString.split(',')) {
                selectedGroupIds.add(Id.valueOf(s));
            }
        }
		
        
        

        
        Mg2_NASFHelper.Mg2_NASFInfo rawNASFInfo = Mg2_NASFHelper.getNasfInfoByAccountId(accountId, selectedGroupIds);
        if (rawNASFInfo.errors != null) {
            asf = new List<PDFItem>();
            List<InfoRows> rows = new List<InfoRows>();
            PDFItem ai = new PDFItem();
            ai.infoType = 'detail';
            ai.header = 'Errors in NASF Data for account: ' + rawNASFInfo.general_info.legal_name;
            asf.add(ai);
            for (Mg2_NASFHelper.valError e : rawNASFInfo.errors) {
                if (e.field_name == null) {
                    ai.addRow('Error: ', e.error_msg);
                } else {
                    ai.addRow('Field: ' + e.field_name, e.error_msg);
                }
            }
        } else {
            asf = loadAsfItems(rawNASFInfo);
        }

		
    }

    // Loads from web service nasfInfo object
    private List<PDFItem> loadAsfItems(Mg2_NASFHelper.Mg2_NASFInfo n) {

        List<PDFItem> result = new List<PDFItem>();
        List<InfoRows> rows = new List<InfoRows>();

        PDFItem ai = new PDFItem();
        ai.header = 'NEW ACCOUNT SETUP FORM: ' + n.general_info.legal_name;
        ai.infoType = 'major';
        result.add(ai);

        ai = new PDFItem();
        ai.header = 'General Information';
        ai.infoType = 'detail';

        //ai.addRow('NASF Version', version);
        ai.addRow('Client Legal Name', n.general_info.legal_name);
        ai.addRow('Client Friendly Name', n.general_info.friendly_name);

        ai.addRow('Client Account GUID', n.general_info.account_guid);
        ai.addRow('Address', n.general_info.address_street + '<br />'
                + n.general_info.address_city + ', '
                + n.general_info.address_state + '<br />' + n.general_info.address_postalcode);
        //result.add(new InfoRows('Client Legal Name',n.general_info.address_city));
        ai.addRow('Phone', n.general_info.phone);
        ai.addRow('Account Owner', n.general_info.sales_agent_name);
        ai.addRow('Account Manager', n.general_info.account_manager_name);
        ai.addRow('Account Business Type', n.general_info.account_type); // SFDCHUB-2128
        ai.addRow('Customer Type', n.general_info.customerType);
        ai.addRow('Business Region', n.general_info.business_region);

        ai.addRow('Does this account receive the invoice?', boolToCheck(n.general_info.receive_invoice));
        ai.addRow('Organization Hierachy ID', n.general_info.orgHierarchyId);
        ai.addRow('Recipient Billing Org Id', n.general_info.recipient_billing_org_id);


        ai.addRow('Benefit Vendor Referrals', boolToCheck(n.general_info.benefit_vendor_referrals));
        ai.addRow('Clinical Integration Services', String.valueOf(n.general_info.clinical_integration));
        ai.addRow('Incentives', String.valueOf(n.general_info.incentives));
        ai.addRow('Incentives - Description', String.valueOf(n.general_info.incentives_description));
        ai.addRow('Special Instructions to Implementations', n.general_info.special_instructions_implementations);


        result.add(ai);

        // Loop through brokers and add to result
        for (Mg2_NASFHelper.brokerInfo bk : n.brokers) {
            ai = new PDFItem();
            ai.header = 'Broker Contact Information: ' + bk.name;
            ai.infoType = 'detail';
            rows = new List<InfoRows>();

            ai.addRow('Contact Name', bk.name);
            ai.addRow('Title', bk.title);

            ai.addRow('Phone', bk.phone);
            ai.addRow('Fax', bk.fax);

            //result.add(new InfoRows('Client Legal Name',n.general_info.address_city));
            ai.addRow('Email', bk.email);
            ai.addRow('Account Name', bk.account_name);

            ai.addRow('Location Name', bk.loc_name);
            ai.addRow('Location ID', bk.loc_id);
            ai.addRow('Location Address', bk.loc_address); //TODO: may need \n to <br />

            ai.addRow('Start Date', bk.start_date == null ? '' : bk.start_date.format());
            ai.addRow('End Date', bk.end_date == null ? '' : bk.end_date.format());

            ai.addRow('Commission %', String.valueOf(bk.commission_pct));
            ai.addRow('Commission Flat Rate', String.valueOf(bk.commission_flat_rate));

            result.add(ai);
        }

        ai = new PDFItem();
        ai.header = 'BILLING AND REPORTING INFO';
        ai.infoType = 'major';
        result.add(ai);

        //TODO: Check if account receives invoice first
        ai = new PDFItem();
        rows = new List<InfoRows>();
        ai.header = 'Billing';
        ai.infoType = 'detail';

        ai.addRow('Primary Billing Contact Name', n.billing_info.contact_name);
        ai.addRow('Invoice Recipient Account', n.billing_info.recipient_account_name);
        ai.addRow('Primary Billing Contact - Street', n.billing_info.address_street);
        ai.addRow('Primary Billing Contact - City', n.billing_info.address_city);
        ai.addRow('Primary Billing Contact - State / Province', n.billing_info.address_state);
        ai.addRow('Primary Billing Contact - ZIP / Postal Code', n.billing_info.address_postalcode);
        ai.addRow('Primary Billing Contact - Country', n.billing_info.address_country);
        ai.addRow('Primary Billing Contact Email', n.billing_info.contact_email);
        //ai.addRow('Invoice Delivery', n.billing_info.delivery);
        ai.addRow('Finance Category', n.billing_info.finance_category);
        //ai.addRow('Finance Sub Category', n.billing_info.finance_sub_category);
        ai.addRow('Payment Terms', n.billing_info.payment_terms);
        ai.addRow('Invoice Currency', n.billing_info.invoice_currency);
        ai.addRow('Invoice Language', n.billing_info.invoice_language);


        result.add(ai);

        ai = new PDFItem();
        rows = new List<InfoRows>();
        ai.header = 'Reporting';
        ai.infoType = 'detail';

        ai.addRow('Report Template', n.reporting_info.report_template);
        ai.addRow('Report Sorting', n.reporting_info.report_sorting);
        ai.addRow('Monthly Report Recipients', n.reporting_info.monthly_recipients);


        result.add(ai);

        ai = new PDFItem();
        ai.header = 'ACCOUNT RELATIONSHIPS';
        ai.infoType = 'major';
        result.add(ai);

        ai = new PDFItem();

        ai.header = 'Servicing Accounts';
        ai.infoType = 'table';

        List<String> tblheaders = new String[]{
                'Svc. Account',
                'Svc. Account Role',
                'Svc. Contract Type',
                'Line of Business',
                'Ben. Sponsor Account',
                'Start Date',
                'End Date'
        };
        List<List<String>> tblrows = new List<List<String>>();
        for (Mg2_NASFHelper.svcAccountInfo sai : n.servicing_accounts) {
            String startDate = (sai.start_date == null ? '' : sai.start_date.format());
            String endDate = (sai.end_date == null ? '' : sai.end_date.format());
            String[] row = new String[]{
                    nullToBlank(sai.svc_account_name),
                    nullToBlank(sai.svc_account_role),
                    nullToBlank(sai.svc_contract_type),
                    nullToBlank(sai.line_of_business),
                    nullToBlank(sai.ben_spon_account_name),
                    startDate,
                    endDate
            };
            tblrows.add(row);
        }

        ai.rows = tblrows;
        ai.headers = tblheaders;
        result.add(ai);

        ai = new PDFItem();
        tblrows = new List<List<String>>();
        ai.header = 'Benefit Sponsor Accounts';
        ai.infoType = 'table';

        tblheaders = new String[]{
                'Acct. Rel. Name',
                'Benefit Sponsor Account',
                'Svc. Account Role',
                'Start Date',
                'End Date'
        };
        tblrows = new List<List<String>>();
        for (Mg2_NASFHelper.benefitSponsorInfo bei : n.benefit_accounts) {
            String startDate = (bei.start_date == null ? '' : bei.start_date.format());
            String endDate = (bei.end_date == null ? '' : bei.end_date.format());

            String[] row = new String[]{
                    bei.rel_name,
                    bei.ben_account_name,
                    bei.svc_account_role,
                    startDate,
                    endDate
            };
            tblrows.add(row);
        }

        ai.rows = tblrows;
        ai.headers = tblheaders;
        result.add(ai);


        for (Mg2_NASFHelper.groupInfo grp : n.groups) {

            String grpNameWithId = grp.name;
            if (!String.isBlank(grp.legacy_id)) {
                grpNameWithId += ' [' + grp.legacy_id + ']';
            }

            ai = new PDFItem();
            ai.header = 'Group: ' + grpNameWithId;
            ai.infoType = 'major';
            result.add(ai);


            ai = new PDFItem();
            rows = null;
            ai.header = 'Group Information';
            ai.infoType = 'table';
            tblheaders = new String[]{
                    //'Legacy Id',
                    'Consult Billing Method',
                    'Payer',
                    'Benefit Sponsor',
                    'Contractee'
            };
            tblrows = new List<List<String>>();
            List<String> row = new String[]{
                    //grp.legacy_id,
                    grp.reimbursement_method,
                    grp.payer,
                    grp.benefit_sponsor,
                    grp.contractee
            };
            tblrows.add(row);
            ai.rows = tblrows;
            ai.headers = tblheaders;
            result.add(ai);

            ai = new PDFItem();

            ai.header = 'Benefit Structures';
            ai.infoType = 'table';

            tblheaders = new String[]{
                    'Product Family',
                    'Product Name',
                    'Code',
                    'Start Date',
                    'Membership Fee Type',
                    'Membership Fee',
                    'Member Visit Fee',
                    'Client Visit Fee',
                    'Print or Less'
            };


            tblrows = new List<List<String>>();
            for (Mg2_NASFHelper.psfInfo psf : grp.structures) {
                String memberFee, clientFee;

                // figure out currency
                String prodCode = psf.product_code.toUpperCase();
                if (prodCode == 'GM' || prodCode == 'NUT' || prodCode == 'GLOBALCARE' || prodCode == 'TDBC') {
                    memberFee = currency(psf.consult_fee_mbr_pd,psf.currencyIsoCode);
                    clientFee = currency(psf.consult_fee_plan_pd,psf.currencyIsoCode);
                } else if (prodCode == 'TC') {
                    memberFee = currency(psf.consult_fee_tobacco_mbr_pd, psf.currencyIsoCode);
                    clientFee = currency(psf.consult_fee_tobacco_plan_pd, psf.currencyIsoCode);
                } else if (prodCode == 'DERM') {
                    memberFee = currency(psf.consult_fee_derm_mbr_pd, psf.currencyIsoCode);
                    clientFee = currency(psf.consult_fee_derm_plan_pd, psf.currencyIsoCode);
                } else if (prodCode == 'TDBC') {
                    memberFee = currency(psf.consult_fee_mbr_pd, psf.currencyIsoCode);
                    clientFee = currency(psf.consult_fee_plan_pd, psf.currencyIsoCode);
                }else if (prodCode == 'GLOBALCARE') {
                    memberFee = currency(psf.consult_fee_mbr_pd, psf.currencyIsoCode);
                    clientFee = currency(psf.consult_fee_plan_pd, psf.currencyIsoCode);
                }
                else {
                    memberFee = '';
                    clientFee = '';
                }

                String membershipFee = '';
                if (
                        psf.pepm_included) {
                    membershipFee = 'Included';
                } else {
                    membershipFee = currency(psf.membership_fee, psf.currencyIsoCode);
                }

                row = new String[]{
                        psf.family,
                        psf.product_name,
                        psf.product_code,
                        psf.start_date,
                        psf.fee_type,
                        membershipFee,
                        memberFee,
                        clientFee,
                        String.ValueOf(psf.actual_Copay_May_Be_Less)
                };
                tblrows.add(row);

                // now break out BH
                // Create BHP1T, BHPOT, BHNPT
                if (prodCode == 'BH') {
                    row = new String[]{
                            'Behavioral Health',
                            'BH First Visit',
                            'BHP1T',
                            psf.start_date,
                            '',

                            '',
                            currency(psf.consult_fee_initial_mbr_pd, psf.currencyIsoCode),
                            currency(psf.consult_fee_initial_plan_pd, psf.currencyIsoCode)
                    };
                    tblrows.add(row);
                    row = new String[]{
                            'Behavioral Health',
                            'BH Ongoing',
                            'BHPOT',
                            psf.start_date,
                            '',

                            '',
                            currency(psf.consult_fee_md_ongoing_mbr_pd, psf.currencyIsoCode),
                            currency(psf.consult_fee_md_ongoing_plan_pd, psf.currencyIsoCode)
                    };
                    tblrows.add(row);
                    row = new String[]{
                            'Behavioral Health',
                            'BH Non MD',
                            'BHNPT',
                            psf.start_date,
                            '',

                            '',
                            currency(psf.consult_fee_non_md_ongoing_mbr_pd, psf.currencyIsoCode),
                            currency(psf.consult_fee_non_md_ongoing_plan_pd, psf.currencyIsoCode)
                    };
                    tblrows.add(row);
                }

            }

            ai.rows = tblrows;
            ai.headers = tblheaders;
            result.add(ai);


            ai = new PDFItem();
            rows = new List<InfoRows>();
            ai.header = 'Additional Information: ' + grpNameWithId;
            ai.infoType = 'subdetail';

            ai.addRow('Company Tags', grp.company_tags);
            ai.addRow('Client Account Location', grp.client_location);
            ai.addRow('Domestic Country', grp.Domestic_Country);
            ai.addRow('Relationship Line of Business', grp.rel_line_of_business);
            
            ai.addRow('Plan Category', grp.plan_category);
            ai.addRow('Plan Type', grp.plan_type);
            ai.addRow('Eligibility Option', grp.eligibility_option);
            ai.addRow('Dependents Included', boolToCheck(grp.dependents_included));
            ai.addRow('Allow Retail Conversion', boolToCheck(grp.allow_conversion));
            //ai.addRow('CCR/CCDA', grp.ccr_ccda);
            ai.addRow('Allow Sexual Health', boolToCheck(grp.allow_sexual_health));
            ai.addRow('Allow Geofencing', boolToCheck(grp.allow_geofencing));
            ai.addRow('Allow Caregiver Program', boolToCheck(grp.allow_caregiver));
            ai.addRow('Teladoc Select', boolToCheck(grp.teladoc_select));
            ai.addRow('Health Assistant', boolToCheck(grp.Health_Assistant));
            ai.addRow('Special Instructions', grp.wk_special_instructions);


            result.add(ai);

            ai = new PDFItem();
            rows = new List<InfoRows>();
            ai.header = 'Welcome Kit: ' + grpNameWithId;
            ai.infoType = 'subdetail';

            ai.addRow('Client Name for Card:' , grp.wk_client_name_on_card);
            ai.addRow('Tri-Branded with Logo', boolToCheck(grp.wk_tri_branded));
            ai.addRow('Send Card', boolToCheck(grp.wk_send_card));
            ai.addRow('Co-Branded with Logo', boolToCheck(grp.wk_co_branded));
            ai.addRow('Mail Class', grp.wk_mail_class);
            //ai.addRow('Print URL', grp.wk_print_url);
            //ai.addRow('Print or Less', boolToCheck(grp.wk_print_or_less));
            //ai.addRow('Print Phone', grp.wk_phone);
            //ai.addRow('Welcome Kit Language', grp.wk_language);
            ai.addRow('Print Template ID #', grp.wk_template);

            result.add(ai);
            // end group loop
        }
        return result;
    }

    // Generic PDF section, can contain detail or a table
    public class PDFItem {
        public String infoType { get; set; }
        public String header { get; set; }
        public List<InfoRows> infoRows { get; set; }
        public List<String> headers { get; set; }
        public List<List<String>> rows { get; set; }

        public PDFItem() {
            infoRows = new List<InfoRows>();
        }

        public void addRow(String key, String val) {
            InfoRows row = new InfoRows(key, val, infoRows.size());
            infoRows.add(row);
        }
    }

    // Generic row of information (name/value pairs)
    public class InfoRows {
        public InfoRows(String label, String val, Integer ix) {
            name = label;
            value = val;
            index = ix;
        }
        public String name { get; set; }
        public String value { get; set; }
        public Integer index { get; set; }
    }

    private String boolToCheck(String val) {
        Boolean boolVal = false;
        if (val != null) {
            boolVal = (val.toLowerCase() == 'true' || val.toLowerCase() == 'yes');
        }
        return boolToCheck(boolVal);
    }



    private String boolToCheck(Boolean val) {

        // another option would be to use an outputField...
        if (val == null) {
            val = false;
        }
        return val ? '<img height="13px" src="/resource/1531253479000/CheckChecked" />' : '<img height="13px" src="/resource/1531268306000/CheckUncheckedGrey" />';
    }

    private String currency(Decimal i, String currencyIsoCode) {
        String num = String.valueOf(i);
        String s = (Decimal.valueOf(num == null || num.trim() == '' ? '0' : num).setScale(2) + 0.001).format();
        return currencyIsoCode +' '+ s.substring(0, s.length() - 1);
    }

    private String nullToBlank(String s) {
        return (s == null ? '' : s);
    }


}