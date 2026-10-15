import { useLocation, useNavigate } from "react-router-dom";
import { PageContainer } from "../../components/common/page-container";
import { PageHeader } from "../../components/common/page-header";
import { EmployeeCreateForm } from "./components/employee-create-form";

export default function NewEmployeeScreen() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <PageContainer>
      <PageHeader
        title="Add employee"
        description="Create an employee profile in the salary management directory."
      />
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
        <EmployeeCreateForm
          onCreated={(employeeId) => navigate(`/employees/${employeeId}${location.search}`)}
          onCancel={() => navigate(`/employees${location.search}`)}
        />
      </section>
    </PageContainer>
  );
}
