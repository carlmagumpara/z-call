import { FaRandom } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useGlobalModal } from '../global-modal';
import { usePresence } from '@/contexts/presence';
import { generateName } from '@/shared/names';
import Avatar from 'boring-avatars';

function Settings() {
  const { show, handleClose } = useGlobalModal();
  const { user_id, username, setUserName } = usePresence();

  const onSubmit = async (values) => {
    localStorage.setItem("username", values.username);
    setUserName(values.username);
    handleClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-18 border border-stroke-strong bg-[#0e1422] shadow-prejoin-card" role="dialog" aria-modal="true" aria-label="Settings">
        <Formik
          initialValues={{
            user_id,
            username,
          }}
          validationSchema={() => Yup.object().shape({
            username: Yup.string().required('Required'),
          })}
          onSubmit={onSubmit}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            handleSubmit,
            isSubmitting,
            setFieldValue,
          }) => (
            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="flex items-center justify-between border-0 px-6 pb-2 pt-5">
                <h2 className="m-0 text-lg font-semibold text-ink">Settings</h2>
                <button
                  type="button"
                  className="cursor-pointer border-0 bg-transparent text-2xl leading-none text-muted transition-colors hover:text-ink"
                  aria-label="Close"
                  onClick={handleClose}
                >
                  ×
                </button>
              </div>

              <div className="px-6 py-4">
                <div className="flex items-center justify-center">
                  <Avatar name={values.username} size={200} variant="beam" />
                </div>

                <div className="mb-3">
                  <label className="mb-1 block text-sm font-medium text-slate-label" htmlFor="settings-username">
                    Username
                  </label>
                  <input
                    id="settings-username"
                    name="username"
                    className={`w-full rounded-10 border bg-surface-input px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent-input-border ${
                      errors.username && touched.username ? 'border-danger' : 'border-stroke-strong'
                    }`}
                    placeholder="Username"
                    value={values.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {errors.username && touched.username && (
                    <p className="mt-1 text-sm text-danger-soft">{errors.username}</p>
                  )}
                </div>

                <div className="mb-3 flex items-center justify-end">
                  <button
                    type="button"
                    className="cursor-pointer rounded-10 border border-stroke bg-surface-strong px-3 py-1.5 text-sm text-ink transition-colors disabled:opacity-50 hover:bg-surface-hover"
                    onClick={() => setFieldValue(
                      'username',
                      `${generateName()}_${Math.floor(Math.random() * 1000)}`.replace(/ /g, '_')
                    )}
                  >
                    <FaRandom className="mr-1 inline-block" /> Generate Name
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-stroke px-6 py-4">
                <button
                  type="button"
                  className="cursor-pointer px-4 py-2 text-sm text-muted transition-colors hover:text-ink"
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cursor-pointer rounded-10 bg-cta px-4 py-2 text-sm font-semibold text-white transition-[filter,background-color] disabled:opacity-65 hover:brightness-110"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Please wait...' : 'Update'}
                </button>
              </div>
            </form>
          )}
        </Formik>
      </div>
    </div>
  );
}

export default Settings;
