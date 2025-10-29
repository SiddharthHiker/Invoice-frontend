import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import moment from "moment";
import { useAuth } from "../../context/AuthContext";

import InputField from "../../components/ui/InputField";
import TextareaField from "../../components/ui/TextareaField";
import SelectField from "../../components/ui/SelectField";
import Button from "../../components/ui/Button";

const CreateInvoice = ({ existingInvoice, onSave, onCancel }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Safe initial state with proper billFrom structure
  const getInitialFormData = () => {
    if (existingInvoice) {
      return {
        ...existingInvoice,
        invoiceDate: moment(existingInvoice.invoiceDate).format('YYYY-MM-DD'),
        dueDate: moment(existingInvoice.dueDate).format("YYYY-MM-DD"),
        billFrom: existingInvoice.billFrom || {
          businessName: "",
          email: "",
          address: "",
          phone: "",
        },
        billTo: existingInvoice.billTo || {
          clientName: "",
          email: "",
          address: "",
          phone: "",
        },
        items: existingInvoice.items || [{ name: "", quantity: 1, unitPrice: 0, taxPercent: 0 }],
      };
    }

    return {
      invoiceNumber: "",
      invoiceDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      billFrom: {
        businessName: user?.businessName || "",
        email: user?.email || "",
        address: user?.address || "",
        phone: user?.phone || "",
      },
      billTo: {
        clientName: "",
        email: "",
        address: "",
        phone: "",
      },
      items: [{ name: "", quantity: 1, unitPrice: 0, taxPercent: 0 }],
      notes: "",
      paymentTerms: "Net 15",
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);
  const [loading, setLoading] = useState(false);
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(!existingInvoice);

  useEffect(() => {
    const aiData = location.state?.aiData;

    if (aiData) {
      setFormData(prev => ({
        ...prev,
        billTo: {
          clientName: aiData.clientName || '',
          email: aiData.email || '',
          address: aiData.address || '',
          phone: aiData.phone || ''
        },
        items: aiData.items || [{ name: "", quantity: 1, unitPrice: 0, taxPercent: 0 }],
      }));
    }

    if (!existingInvoice) {
      const generateNewInvoiceNumber = async () => {
        setIsGeneratingNumber(true);
        try {
          const response = await axiosInstance.get(API_PATHS.INVOICE.GET_ALL_INVOICES);
          const invoices = response.data || [];
          
          let maxNum = 0;
          invoices.forEach((inv) => {
            if (inv.invoiceNumber) {
              const match = inv.invoiceNumber.match(/(\d+)$/);
              if (match) {
                const num = parseInt(match[1]);
                if (!isNaN(num) && num > maxNum) maxNum = num;
              }
            }
          });
          
          const newInvoiceNumber = `INV_${String(maxNum + 1).padStart(3, "0")}`;
          setFormData((prev) => ({ ...prev, invoiceNumber: newInvoiceNumber }));
        } catch (error) {
          console.error("Failed to generate invoice number", error);
          const newInvoiceNumber = `INV_${Date.now().toString().slice(-5)}`;
          setFormData((prev) => ({ ...prev, invoiceNumber: newInvoiceNumber }));
        }
        setIsGeneratingNumber(false);
      };
      generateNewInvoiceNumber();
    }
  }, [existingInvoice, location.state]);

  // Safe handler for nested objects
  const handleInputChange = (e, section, index) => {  
    const { name, value } = e.target;
    
    if (section) {
      setFormData((prev) => ({ 
        ...prev, 
        [section]: { 
          ...(prev[section] || {}), // Ensure section exists
          [name]: value
        }
      }));
    } else if (index !== undefined) {
      const newItems = [...formData.items];
      newItems[index] = { 
        ...newItems[index], 
        [name]: name === 'quantity' || name === 'unitPrice' || name === 'taxPercent' 
          ? parseFloat(value) || 0 
          : value 
      };
      setFormData((prev) => ({ ...prev, items: newItems }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddItem = () => {
    setFormData({ 
      ...formData, 
      items: [
        ...formData.items, 
        { name: "", quantity: 1, unitPrice: 0, taxPercent: 0 }
      ] 
    });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    } else {
      toast.error("At least one item is required");
    }
  };

  // Safe calculation with defaults
  const { subtotal, taxTotal, total } = (() => {
    let subtotal = 0, taxTotal = 0;
    (formData.items || []).forEach((item) => {
      const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
      subtotal += itemTotal;
      taxTotal += itemTotal * ((item.taxPercent || 0) / 100);
    });
    return { 
      subtotal: Number(subtotal.toFixed(2)), 
      taxTotal: Number(taxTotal.toFixed(2)), 
      total: Number((subtotal + taxTotal).toFixed(2))
    };
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.billTo?.clientName || !formData.billTo?.email) {
      toast.error("Client name and email are required");
      return;
    }

    if (formData.items.some(item => !item.name || item.quantity <= 0)) {
      toast.error("All items must have a name and quantity greater than 0");
      return;
    }

    setLoading(true);
    
    const itemsWithTotal = formData.items.map((item) => {
      const itemSubtotal = (item.quantity || 0) * (item.unitPrice || 0);
      const itemTax = itemSubtotal * ((item.taxPercent || 0) / 100);
      const itemTotal = itemSubtotal + itemTax;
      
      return {
        ...item,
        subtotal: Number(itemSubtotal.toFixed(2)),
        taxAmount: Number(itemTax.toFixed(2)),
        total: Number(itemTotal.toFixed(2))
      };
    });

    const finalFormData = { 
      ...formData, 
      items: itemsWithTotal, 
      subtotal, 
      taxTotal, 
      total,
      status: existingInvoice ? formData.status : "draft"
    };

    if (onSave) {
      await onSave(finalFormData);
    } else {
      try {
        await axiosInstance.post(API_PATHS.INVOICE.CREATE, finalFormData);
        toast.success("Invoice created successfully!");
        navigate("/invoices");
      } catch (error) {
        toast.error("Failed to create invoice");
        console.error("Invoice creation error:", error);
      }
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {onCancel && (
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onCancel}
              icon={ArrowLeft}
            >
              Back
            </Button>
          )}
          <h2 className="text-xl font-semibold text-slate-900">
            {existingInvoice ? "Edit Invoice" : "Create Invoice"}
          </h2>
        </div>
        <Button type="submit" isLoading={loading || isGeneratingNumber}>
          {existingInvoice ? "Save Changes" : "Save Invoice"}
        </Button>
      </div>

      {/* Invoice Details */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InputField
            label="Invoice Number"
            name="invoiceNumber"
            value={formData.invoiceNumber}
            placeholder={isGeneratingNumber ? "Generating..." : "INV_001"}
            readOnly
          />
          <InputField 
            label="Invoice Date" 
            type="date" 
            name="invoiceDate" 
            value={formData.invoiceDate} 
            onChange={handleInputChange} 
            required
          />
          <InputField 
            label="Due Date" 
            type="date" 
            name="dueDate" 
            value={formData.dueDate} 
            onChange={handleInputChange} 
            required
          />
        </div>
      </div>

      {/* Bill From & Bill To */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Bill From</h3>
          <InputField 
            label="Business Name" 
            name="businessName" 
            value={formData.billFrom?.businessName || ""} 
            onChange={(e) => handleInputChange(e, "billFrom")} 
          />
          <InputField 
            label="Email" 
            type="email" 
            name="email" 
            value={formData.billFrom?.email || ""} 
            onChange={(e) => handleInputChange(e, "billFrom")} 
          />
          <InputField 
            label="Address" 
            name="address" 
            value={formData.billFrom?.address || ""} 
            onChange={(e) => handleInputChange(e, "billFrom")} 
          />
          <InputField 
            label="Phone" 
            name="phone" 
            value={formData.billFrom?.phone || ""} 
            onChange={(e) => handleInputChange(e, "billFrom")} 
          />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Bill To</h3>
          <InputField 
            label="Client Name" 
            name="clientName" 
            value={formData.billTo?.clientName || ""} 
            onChange={(e) => handleInputChange(e, "billTo")} 
            required
          />
          <InputField 
            label="Client Email" 
            type="email" 
            name="email" 
            value={formData.billTo?.email || ""} 
            onChange={(e) => handleInputChange(e, "billTo")} 
            required
          />
          <InputField 
            label="Client Address" 
            name="address" 
            value={formData.billTo?.address || ""} 
            onChange={(e) => handleInputChange(e, "billTo")} 
          />
          <InputField 
            label="Client Phone" 
            name="phone" 
            value={formData.billTo?.phone || ""} 
            onChange={(e) => handleInputChange(e, "billTo")} 
          />
        </div>
      </div>

      {/* Rest of the component remains the same */}
      {/* Items Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-900">Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tax (%)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {formData.items.map((item, index) => {
                const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
                const itemTax = itemTotal * ((item.taxPercent || 0) / 100);
                const totalWithTax = itemTotal + itemTax;
                
                return (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <input 
                        type="text" 
                        name="name" 
                        value={item.name} 
                        onChange={(e) => handleInputChange(e, null, index)} 
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="Item name" 
                        required
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        type="number" 
                        name="quantity" 
                        min="1"
                        value={item.quantity} 
                        onChange={(e) => handleInputChange(e, null, index)} 
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        required
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        type="number" 
                        name="unitPrice" 
                        min="0"
                        step="0.01"
                        value={item.unitPrice} 
                        onChange={(e) => handleInputChange(e, null, index)} 
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        required
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        type="number" 
                        name="taxPercent" 
                        min="0"
                        step="0.01"
                        value={item.taxPercent} 
                        onChange={(e) => handleInputChange(e, null, index)} 
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      ${totalWithTax.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="small" 
                        onClick={() => handleRemoveItem(index)}
                        disabled={formData.items.length === 1}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-6 border-t border-slate-200">
          <Button type="button" variant="secondary" onClick={handleAddItem} icon={Plus}>
            Add Item
          </Button>
        </div>
      </div>

      {/* Notes and Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Notes & Terms</h3>
          <TextareaField 
            label="Notes" 
            name="notes" 
            value={formData.notes} 
            onChange={handleInputChange}
            rows={4}
          />
          <SelectField
            label="Payment Terms"
            name="paymentTerms"
            value={formData.paymentTerms}
            onChange={handleInputChange}
            options={["Net 15", "Net 30", "Net 60", "Due on receipt"]}
          />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Tax:</span>
              <span>${taxTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold text-slate-900 border-t border-slate-200 pt-3 mt-3">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default CreateInvoice;