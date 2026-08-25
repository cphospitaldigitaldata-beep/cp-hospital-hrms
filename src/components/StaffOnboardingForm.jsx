import React, { useState } from 'react';

export default function StaffOnboardingForm() {
  const [formData, setFormData] = useState({
    full_name: '',
    designation: 'DOCTOR',
    department: 'Cardiology',
    email: '',
    phone: '',
    pan_number: '',
    account_number: '',
    ifsc_code: '',
    bank_name: '',
    license_number: ''
  });

  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const departmentsList = [
    'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Emergency / Trauma',
    'ICU / Critical Care', 'Gynecology', 'Radiology', 'Pharmacy', 'Administration', 'Nursing Care'
  ];

  const designationsList = [
    { value: 'DOCTOR', label: 'Clinical Doctor / Consultant' },
    { value: 'NURSE', label: 'Nursing Staff / Matron' },
    { value: 'PHARMACY', label: 'Pharmacy Technician' },
    { value: 'ADMIN', label: 'Hospital Administrator' },
    { value: 'LAB', label: 'Laboratory & Radiology Tech' }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponseMessage(null);

    try {
      const response = await fetch('http://localhost:5000/api/v1/hr/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setResponseMessage({ type: 'success', text: `Success! Employee Code: ${data.data.employee_code}` });
        setSuccessData(data.data);
      } else {
        setResponseMessage({ type: 'error', text: data.error || 'Onboarding failed.' });
      }
    } catch (error) {
      setResponseMessage({ type: 'error', text: 'Network error. Please check backend connection.' });
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-200 my-8">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => { setSuccessData(null); }} 
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 font-semibold transition"
          >
            ← Back to Form
          </button>
          <button 
            onClick={() => window.print()} 
            className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 transition"
          >
            Print / Save Letter & ID Card
          </button>
        </div>

        <div className="text-center border-b-2 border-blue-600 pb-4 mb-6">
          <h1 className="text-3xl font-extrabold text-blue-800">🏥 CP HOSPITAL ENTERPRISE</h1>
          <p className="text-sm font-medium text-gray-600 mt-1">
            Jaipur Road, Gangapur City, Distt. Sawai Madhopur - 322201, Rajasthan
          </p>
          <p className="text-sm font-semibold text-blue-700">Helpline / Mobile: +91 809423150</p>
        </div>

        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-400 rounded-xl shadow-inner flex justify-between items-center">
          <div>
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-bold uppercase">Official ID Card</span>
            <h3 className="text-xl font-bold text-gray-800 mt-2">{successData.full_name}</h3>
            <p className="text-sm font-semibold text-blue-700">{successData.designation} - {successData.department}</p>
            <p className="text-xs text-gray-600 mt-1">Emp Code: <span className="font-bold">{successData.employee_code}</span></p>
            <p className="text-xs text-gray-600">Mobile: {successData.phone}</p>
          </div>
          <div className="text-right border-l-2 border-blue-300 pl-6">
            <p className="text-xs font-bold text-gray-700">CP HOSPITAL</p>
            <p className="text-[10px] text-gray-500">Gangapur City, Raj.</p>
            <div className="mt-2 w-20 h-20 bg-white border border-gray-300 rounded flex items-center justify-center text-[10px] text-gray-400 font-semibold">
              PHOTO
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-3">1. Appointment & Joining Letter</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Dear <strong>{successData.full_name}</strong>, we are delighted to formally appoint you as <strong>{successData.designation}</strong> in the Department of <strong>{successData.department}</strong> at CP Hospital Enterprise, Gangapur City. Your appointment is effective immediately under the standard medical governance, state health regulations, and administrative protocols of Rajasthan.
          </p>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-3">2. Service Terms and Conditions & Professional Protocol</h3>
          <div className="text-xs text-gray-700 space-y-3 leading-relaxed">
            <p><strong>Article I - Professional Ethics & Clinical Standards:</strong> All clinical personnel, doctors, and nursing staff shall uphold absolute medical integrity, adhering strictly to patient safety norms, National/State medical council guidelines, and ethical standards stipulated by CP Hospital.</p>
            <p><strong>Article II - Confidentiality & Patient Data Privacy:</strong> In compliance with healthcare privacy laws, all electronic health records (EHR), diagnostic reports, patient identities, and institutional data must remain strictly confidential. Unauthorized disclosures will invite immediate termination and legal action.</p>
            <p><strong>Article III - Duty Roster & Shift Commitments:</strong> Personnel are required to strictly follow rotational shift requirements, emergency on-call rosters, and attendance policies managed by the respective Department Head and Hospital Administration.</p>
            <p><strong>Article IV - Compensation, Banking & Payroll:</strong> Salaries, allowances, and statutory deductions (PF/TDS) will be processed directly into the verified bank account provided during onboarding (Account: {successData.account_number} | IFSC: {successData.ifsc_code} | Bank: {successData.bank_name}).</p>
            <p><strong>Article V - Discipline, Code of Conduct & Separation:</strong> Any breach of hospital safety frameworks, insubordination, or professional negligence will trigger internal disciplinary inquiries. Resignation requires a mandatory notice period of 30 days for general staff and 90 days for senior medical consultants.</p>
          </div>
        </div>

        <div className="flex justify-between mt-12 pt-6 border-t text-sm text-gray-600">
          <div>
            <p className="font-semibold">{successData.full_name}</p>
            <p className="text-xs text-gray-500">Employee Signature</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">Authorized HR Signatory</p>
            <p className="text-xs text-gray-500">CP Hospital Enterprise, Gangapur City</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-200 my-8">
      <div className="border-b pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🏥 CP Hospital - Staff Onboarding</h2>
        <p className="text-sm text-gray-500">Register clinical and administrative personnel securely with automated letter and ID card generation.</p>
      </div>

      {responseMessage && (
        <div className={`p-4 mb-4 rounded text-sm ${responseMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {responseMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name *</label>
          <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Dr. Rajesh Sharma" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Designation / Cadre *</label>
            <select name="designation" value={formData.designation} onChange={handleChange} className="w-full mt-1 p-2 border border-gray-300 rounded">
              {designationsList.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Department *</label>
            <select name="department" value={formData.department} onChange={handleChange} className="w-full mt-1 p-2 border border-gray-300 rounded">
              {departmentsList.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded" placeholder="doctor@cphospital.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded" placeholder="+91 809423150" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">PAN Card Number *</label>
            <input type="text" name="pan_number" value={formData.pan_number} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded uppercase" placeholder="ABCDE1234F" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Medical / Professional License No.</label>
            <input type="text" name="license_number" value={formData.license_number} onChange={handleChange} className="w-full mt-1 p-2 border border-gray-300 rounded" placeholder="MCI / Nursing Council Reg No." />
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <h3 className="text-md font-semibold text-gray-800 mb-3">Bank Details (Payroll Setup)</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700">Account Number *</label>
              <input type="text" name="account_number" value={formData.account_number} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded text-sm" placeholder="A/C Number" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">IFSC Code *</label>
              <input type="text" name="ifsc_code" value={formData.ifsc_code} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded text-sm uppercase" placeholder="SBIN0001234" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Bank Name *</label>
              <input type="text" name="bank_name" value={formData.bank_name} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded text-sm" placeholder="SBI / ICICI" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded font-semibold hover:bg-blue-700 transition duration-200 mt-4">
          {loading ? 'Processing Onboarding & Generating ID Card...' : 'Submit & Generate Appointment, Terms & ID Card'}
        </button>
      </form>
    </div>
  );
}