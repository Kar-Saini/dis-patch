import { SALARY_CONSTANTS } from "@/app/action/salaryConstants";
import { SALARY_SLIP_DATA_TYPE } from "@/lib/types";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#333333",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  companyHeader: {
    fontSize: 16,
    fontWeight: 800,
    color: "#2596be",
  },
  companyAddress: {
    fontSize: 9,
    marginTop: 2,
  },
  logo: {
    width: 50,
    height: 50,
  },
  table: {
    borderWidth: 1,
    borderColor: "#cccccc",
  },
  titleRow: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 12,
    padding: 8,
    borderBottomWidth: 1,
    borderColor: "#cccccc",
  },
  summaryRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#cccccc",
  },
  summaryLeft: {
    width: "50%",
    padding: 12,
    borderRightWidth: 1,
    borderColor: "#cccccc",
  },
  summaryRight: {
    width: "50%",
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 11,
    marginBottom: 8,
  },
  fieldRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  fieldLabel: {
    width: 90,
    fontWeight: "bold",
  },
  fieldColon: {
    width: 10,
  },
  fieldValue: {
    flex: 1,
  },
  netPayLabel: {
    fontWeight: "bold",
    marginBottom: 6,
  },
  netPayNumber: {
    color: "#00a040",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
  },
  bankRow: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#cccccc",
  },
  bankCol: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#cbcaca",
  },
  tableHeaderCell: {
    width: "50%",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "6px 10px",
    fontWeight: "bold",
    fontSize: 10,
  },
  lineItemsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#cccccc",
  },
  lineItemsCol: {
    width: "50%",
    padding: "8px 10px",
    borderRightWidth: 1,
    borderColor: "#cccccc",
  },
  lineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  totalsRow: {
    flexDirection: "row",
  },
  totalsCol: {
    width: "50%",
    padding: "8px 10px",
    borderRightWidth: 1,
    borderColor: "#cccccc",
  },
  totalsLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontWeight: "bold",
  },
  netPayBox: {
    textAlign: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#00a85a",
    marginTop: 18,
    padding: 10,
  },
  netPayBoxText: {
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  netPayBoxNote: {
    fontSize: 9,
    fontWeight: "normal",
    textAlign: "center",
    color: "#555",
  },
  footerNote: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 9,
    color: "#777777",
  },
});

export default function SalarySlipDocument({
  data,
}: {
  data: SALARY_SLIP_DATA_TYPE;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Company header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.companyHeader}>
              GOA OCEANARIUM PRIVATE LIMITED
            </Text>
            <Text style={styles.companyAddress}>
              H. No. 78, Malbhat, Margao, South Goa, Goa 403601
            </Text>
          </View>
          {SALARY_CONSTANTS.logoBase64 && (
            <Image
              style={styles.logo}
              src={`data:image/png;base64,${SALARY_CONSTANTS.logoBase64}`}
            />
          )}
        </View>

        <View style={styles.table}>
          <Text style={styles.titleRow}>
            Payslip for the month of {data.month} {data.year}
          </Text>

          {/* Employee summary + net pay */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryLeft}>
              <Text style={styles.sectionTitle}>EMPLOYEE SUMMARY</Text>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Employee Name</Text>
                <Text style={styles.fieldColon}>:</Text>
                <Text style={styles.fieldValue}>{data.employee_name}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Employee ID</Text>
                <Text style={styles.fieldColon}>:</Text>
                <Text style={styles.fieldValue}>{data.employee_id}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Designation</Text>
                <Text style={styles.fieldColon}>:</Text>
                <Text style={styles.fieldValue}>{data.designation}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Pay Period</Text>
                <Text style={styles.fieldColon}>:</Text>
                <Text style={styles.fieldValue}>
                  {data.month} {data.year}
                </Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Pay Date</Text>
                <Text style={styles.fieldColon}>:</Text>
                <Text style={styles.fieldValue}>{data.pay_date}</Text>
              </View>
            </View>

            <View style={styles.summaryRight}>
              <Text style={styles.netPayLabel}>Total Net Pay</Text>
              <Text style={styles.netPayNumber}>Rs. {data.net_pay}</Text>
              <Text>
                Paid Days: {data.paid_days} | LOP Days: {data.lop_days}
              </Text>
            </View>
          </View>

          {/* PAN / Bank details */}
          <View style={styles.bankRow}>
            <View style={styles.bankCol}>
              <Text style={{ fontWeight: "bold", width: 90 }}>PAN</Text>
              <Text>: {data.pan}</Text>
            </View>
            <View style={styles.bankCol}>
              <Text style={{ fontWeight: "bold", width: 100 }}>Bank</Text>
              <Text>: {data.bank}</Text>
            </View>
          </View>
          <View style={styles.bankRow}>
            <View style={styles.bankCol}>
              <Text style={{ fontWeight: "bold", width: 90 }}>
                Bank A/C No.
              </Text>
              <Text>: {data.account_no}</Text>
            </View>
            <View style={styles.bankCol}>
              <Text style={{ fontWeight: "bold", width: 100 }}>Bank IFSC</Text>
              <Text>: {data.ifsc}</Text>
            </View>
          </View>

          {/* Earnings / Deductions header */}
          <View style={styles.tableHeaderRow}>
            <View style={styles.tableHeaderCell}>
              <Text>EARNINGS</Text>
              <Text>AMOUNT</Text>
            </View>
            <View style={styles.tableHeaderCell}>
              <Text>DEDUCTIONS</Text>
              <Text>AMOUNT</Text>
            </View>
          </View>

          {/* Earnings / Deductions line items */}
          <View style={styles.lineItemsRow}>
            <View style={styles.lineItemsCol}>
              <View style={styles.lineItem}>
                <Text>Basic</Text>
                <Text>Rs. {data.basic}</Text>
              </View>
              <View style={styles.lineItem}>
                <Text>House Rent Allowance</Text>
                <Text>Rs. {data.hra}</Text>
              </View>
              <View style={styles.lineItem}>
                <Text>Special Allowance</Text>
                <Text>Rs. {data.special_allowance}</Text>
              </View>
            </View>
            <View style={styles.lineItemsCol}>
              <View style={styles.lineItem}>
                <Text>Income Tax</Text>
                <Text>Rs. {data.income_tax}</Text>
              </View>
              <View style={styles.lineItem}>
                <Text>Provident Fund</Text>
                <Text>Rs. {data.pf}</Text>
              </View>
              <View style={styles.lineItem}>
                <Text>Health &amp; Education Cess</Text>
                <Text>Rs. {data.cess}</Text>
              </View>
            </View>
          </View>

          {/* Totals */}
          <View style={styles.totalsRow}>
            <View style={styles.totalsCol}>
              <View style={styles.totalsLine}>
                <Text>Gross Earnings</Text>
                <Text>Rs. {data.gross_earnings}</Text>
              </View>
            </View>
            <View style={[styles.totalsCol, { borderRightWidth: 0 }]}>
              <View style={styles.totalsLine}>
                <Text>Total Deductions</Text>
                <Text>Rs. {data.total_deductions}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Net pay box */}
        <View style={styles.netPayBox}>
          <Text style={styles.netPayBoxText}>
            Total Net Payable Rs. {data.net_pay} ({data.net_pay_words})
          </Text>
          <Text style={styles.netPayBoxNote}>
            **Total Net Payable = Gross Earnings - Total Deductions
          </Text>
        </View>

        <Text style={styles.footerNote}>
          --This is a system-generated document.--
        </Text>
      </Page>
    </Document>
  );
}
