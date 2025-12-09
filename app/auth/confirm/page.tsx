// app/auth/confirm/page.tsx

'use client';



export default function ConfirmEmail() {

  return (

    <div className="flex min-h-screen items-center justify-center">

      <div className="text-center max-w-md px-6">

        <h1 className="text-2xl font-bold mb-4">

          Vérifiez votre email

        </h1>

        <p className="text-gray-600 mb-4">

          Nous vous avons envoyé un email de confirmation. 

          Cliquez sur le lien dans l'email pour activer votre compte.

        </p>

        <p className="text-sm text-gray-500">

          Vous n'avez pas reçu l'email ? Vérifiez vos spams.

        </p>

      </div>

    </div>

  );

}
