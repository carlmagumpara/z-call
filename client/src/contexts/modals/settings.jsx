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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-xl" role="dialog" aria-modal="true" aria-label="Settings">
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
                <h2 className="m-0 text-lg font-medium text-gray-900">Settings</h2>
                <button
                  type="button"
                  className="cursor-pointer border-0 bg-transparent text-2xl leading-none text-gray-500 hover:text-gray-800"
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
                  <label className="mb-1 block text-sm font-medium text-gray-800" htmlFor="settings-username">
                    Username
                  </label>
                  <input
                    id="settings-username"
                    name="username"
                    className={`w-full rounded border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-accent ${
                      errors.username && touched.username ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Username"
                    value={values.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {errors.username && touched.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                  )}
                </div>

                <div className="mb-3 flex items-center justify-end">
                  <button
                    type="button"
                    className="cursor-pointer rounded border border-gray-400 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-50 hover:bg-gray-100"
                    onClick={() => setFieldValue(
                      'username',
                      `${generateName()}_${Math.floor(Math.random() * 1000)}`.replace(/ /g, '_')
                    )}
                  >
                    <FaRandom className="mr-1 inline-block" /> Generate Name
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
                <button
                  type="button"
                  className="cursor-pointer px-4 py-2 text-sm text-gray-700 hover:underline"
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cursor-pointer rounded bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-65 hover:bg-red-700"
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
