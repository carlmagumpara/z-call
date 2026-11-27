import Cat from '@/assets/cat.gif';

function LoaderFull() {
  return (
    <div className="absolute inset-0 flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center">
        <img className="w-[50px]" src={Cat} alt="Loading" />
      </div>
    </div>
  );
}

export default LoaderFull;
