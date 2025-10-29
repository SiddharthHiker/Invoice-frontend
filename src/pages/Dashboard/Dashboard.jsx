import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { Loader2, FileText, DollarSign, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import Button from "../../components/ui/Button";
import AIInsightsCard from "../../components/AIInsightsCard";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalPaid: 0,
    totalUnpaid: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axiosInstance.get(
          API_PATHS.INVOICE.GET_ALL_INVOICES
        );
        const invoices = response.data || [];
        
        console.log("Fetched invoices:", invoices); // Debug log

        const totalInvoices = invoices.length;
        const totalPaid = invoices
          .filter((inv) => inv.status === "Paid" || inv.status === "paid")
          .reduce((acc, inv) => acc + (inv.total || 0), 0);

        const totalUnpaid = invoices
          .filter((inv) => inv.status !== "Paid" && inv.status !== "paid")
          .reduce((acc, inv) => acc + (inv.total || 0), 0);

        setStats({ 
          totalInvoices, 
          totalPaid, 
          totalUnpaid 
        });
        
        setRecentInvoices(
          invoices
            .sort((a, b) => new Date(b.invoiceDate || b.createdAt) - new Date(a.invoiceDate || a.createdAt))
            .slice(0, 5)
        );
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const statsData = [
    {
      icon: FileText,
      label: "Total Invoices",
      value: stats.totalInvoices,
      color: "blue",
    },
    {
      icon: DollarSign,
      label: "Total Paid",
      value: `$${stats.totalPaid.toFixed(2)}`,
      color: "emerald",
    },
    {
      icon: DollarSign,
      label: "Total Unpaid",
      value: `$${stats.totalUnpaid.toFixed(2)}`,
      color: "red",
    },
  ];

  const colorClasses = {
    blue: { bg: "bg-blue-100", text: "text-blue-600" },
    emerald: { bg: "bg-emerald-100", text: "text-emerald-600" },
    red: { bg: "bg-red-100", text: "text-red-600" },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-600 mt-1">
          A quick overview of your business finances.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsData.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
          >
            <div className="flex items-center">
              <div
                className={`flex-shrink-0 w-12 h-12 ${colorClasses[stat.color].bg} rounded-lg flex items-center justify-center`}
              >
                <stat.icon
                  className={`w-6 h-6 ${colorClasses[stat.color].text}`}
                />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-slate-500">
                  {stat.label}
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {stat.value}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Insights Card */}
      <AIInsightsCard />

      {/* Recent Invoices */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-900">
            Recent Invoices
          </h3>
          <Button 
            variant="ghost" 
            onClick={() => navigate("/invoices")}
            size="small"
          >
            View All
          </Button>
        </div>

        {recentInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Invoice Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {recentInvoices.map((invoice) => (
                  <tr
                    key={invoice._id}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/invoices/${invoice._id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {invoice.billTo?.clientName || "Unknown Client"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">
                        {invoice.invoiceNumber || `INV_${invoice._id?.slice(-6)}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      ${(invoice.total || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          invoice.status === "Paid" || invoice.status === "paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : invoice.status === "Pending" || invoice.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {invoice.status || "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {invoice.dueDate 
                        ? moment(invoice.dueDate).format("MMM D, YYYY")
                        : "No due date"
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No invoices yet
            </h3>
            <p className="text-slate-500 mb-6 max-w-md">
              You haven't created any invoices yet. Get started by creating your first one.
            </p>
            <Button 
              onClick={() => navigate("/invoices/new")} 
              icon={Plus}
            >
              Create Invoice
            </Button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <Button 
            onClick={() => navigate("/invoices/new")} 
            icon={Plus}
            variant="primary"
          >
            Create New Invoice
          </Button>
          <Button 
            onClick={() => navigate("/invoices")} 
            variant="secondary"
          >
            View All Invoices
          </Button>
          <Button 
            onClick={() => navigate("/clients")} 
            variant="secondary"
          >
            Manage Clients
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;