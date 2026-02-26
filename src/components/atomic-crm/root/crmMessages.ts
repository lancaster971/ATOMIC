/**
 * CRM-specific translation messages for both English and Italian.
 * These complement the base ra-language-* and ra-supabase-language-* messages.
 */

export const crmEnglishMessages = {
  crm: {
    nav: {
      dashboard: "Dashboard",
      contacts: "Contacts",
      companies: "Companies",
      deals: "Deals",
      users: "Users",
      profile: "Profile",
      settings: "Settings",
      import_data: "Import data",
      home: "Home",
      tasks: "Tasks",
    },
    contacts: {
      create: "Create Contact",
      edit: "Edit",
      merge_with: "Merge with another contact",
      merge_title: "Merge Contact",
      merge_description: "Merge this contact with another one.",
      current_contact: "Current Contact (will be deleted)",
      target_contact: "Target Contact (will be kept)",
      what_will_be_merged: "What will be merged:",
      notes_will_be_reassigned:
        "%{count} note will be reassigned |||| %{count} notes will be reassigned",
      tasks_will_be_reassigned:
        "%{count} task will be reassigned |||| %{count} tasks will be reassigned",
      deals_will_be_updated:
        "%{count} deal will be updated |||| %{count} deals will be updated",
      emails_will_be_added:
        "%{count} email address will be added |||| %{count} email addresses will be added",
      phones_will_be_added:
        "%{count} phone number will be added |||| %{count} phone numbers will be added",
      no_data_to_merge: "No additional data to merge",
      warning_destructive: "Warning: Destructive Operation",
      warning_message:
        "All data will be transferred to the second contact. This action cannot be undone.",
      merge_contacts: "Merge Contacts",
      merging: "Merging...",
      select_contact_warning: "Please select a contact to merge with",
      merge_success: "Contacts merged successfully",
      merge_error: "Failed to merge contacts",
      import_csv: "Import CSV",
      import_title: "Import",
      import_running: "The import is running, please do not close this tab.",
      import_progress:
        "Imported %{imported} / %{total} contacts, with %{errors} errors.",
      import_remaining: "Estimated remaining time:",
      import_stop: "Stop import",
      import_error:
        "Failed to import this file, please make sure your provided a valid CSV file.",
      import_complete:
        "Contacts import complete. Imported %{imported} contacts, with %{errors} errors",
      import_sample: "Here is a sample CSV file you can use as a template",
      import_download_sample: "Download CSV sample",
      csv_file: "CSV File",
      export_vcard: "Export to vCard",
    },
    companies: {
      create: "Create Company",
    },
    deals: {
      updated: "Deal updated",
      edit_deal: "Edit %{name} deal",
      back_to_deal: "Back to deal",
      view_archived: "View archived deals",
      archived_title: "Archived Deals",
    },
    tasks: {
      description: "Description",
      contact: "Contact",
      edit_title: "Edit task",
      updated: "Task updated",
      deleted: "Task deleted",
      load_more: "Load more",
    },
    import: {
      title: "Import Data",
      description:
        "You can import sales, companies, contacts, companies, notes, and tasks.",
      json_format: "Data must be in a JSON file matching the following sample:",
      sample_file: "sample.json",
      unable_to_import: "Unable to import this file.",
      in_progress: "Import in progress, please don't navigate away from this page.",
      complete: "Import complete.",
      some_failed: "Some records were not imported.",
      all_success: "All records were imported successfully.",
      download_error_report: "Download the error report",
      import_another: "Import another file",
      imported: "Imported",
      failed: "Failed",
      entity_sales: "sales",
      entity_companies: "companies",
      entity_contacts: "contacts",
      entity_notes: "notes",
      entity_tasks: "tasks",
    },
    misc: {
      create: "Create",
      close: "Close",
      contact: "Contact",
      note: "Note",
      task: "Task",
    },
    settings: {
      title: "Settings",
      branding: "Branding",
      app_title: "App Title",
      light_mode_logo: "Light Mode Logo",
      dark_mode_logo: "Dark Mode Logo",
      companies: "Companies",
      sectors: "Sectors",
      deals: "Deals",
      stages: "Stages",
      pipeline_statuses: "Pipeline Statuses",
      pipeline_description:
        'Select which deal stages count as "pipeline" (completed) deals.',
      categories: "Categories",
      notes: "Notes",
      statuses: "Statuses",
      tasks: "Tasks",
      types: "Types",
      authentication: "Authentication",
      ldap_title: "LDAP / Active Directory",
      ldap_description: "Enable LDAP authentication for Active Directory or Azure AD DS.",
      reset_to_defaults: "Reset to Defaults",
      cancel: "Cancel",
      save: "Save",
      saving: "Saving...",
      saved: "Configuration saved successfully",
      save_error: "Failed to save configuration",
    },
  },
  "ra-supabase": {
    auth: {
      email: "Email",
      confirm_password: "Confirm password",
      sign_in_with: "Sign in with %{provider}",
      forgot_password: "Forgot password?",
      reset_password: "Reset password",
      password_reset:
        "Check your emails for a Reset Password message.",
      missing_tokens: "Access and refresh tokens are missing",
      back_to_login: "Back to login",
    },
    reset_password: {
      forgot_password: "Forgot password?",
      forgot_password_details: "Enter your email for instructions.",
    },
    set_password: {
      new_password: "Choose your password",
    },
    validation: {
      password_mismatch: "Passwords do not match",
    },
  },
};

export const crmItalianMessages = {
  crm: {
    nav: {
      dashboard: "Dashboard",
      contacts: "Contatti",
      companies: "Aziende",
      deals: "Trattative",
      users: "Utenti",
      profile: "Profilo",
      settings: "Impostazioni",
      import_data: "Importa dati",
      home: "Home",
      tasks: "Attivit\u00e0",
    },
    contacts: {
      create: "Crea Contatto",
      edit: "Modifica",
      merge_with: "Unisci con un altro contatto",
      merge_title: "Unisci Contatto",
      merge_description: "Unisci questo contatto con un altro.",
      current_contact: "Contatto corrente (verr\u00e0 eliminato)",
      target_contact: "Contatto di destinazione (verr\u00e0 mantenuto)",
      what_will_be_merged: "Cosa verr\u00e0 unito:",
      notes_will_be_reassigned:
        "%{count} nota verr\u00e0 riassegnata |||| %{count} note verranno riassegnate",
      tasks_will_be_reassigned:
        "%{count} attivit\u00e0 verr\u00e0 riassegnata |||| %{count} attivit\u00e0 verranno riassegnate",
      deals_will_be_updated:
        "%{count} trattativa verr\u00e0 aggiornata |||| %{count} trattative verranno aggiornate",
      emails_will_be_added:
        "%{count} indirizzo email verr\u00e0 aggiunto |||| %{count} indirizzi email verranno aggiunti",
      phones_will_be_added:
        "%{count} numero di telefono verr\u00e0 aggiunto |||| %{count} numeri di telefono verranno aggiunti",
      no_data_to_merge: "Nessun dato aggiuntivo da unire",
      warning_destructive: "Attenzione: operazione distruttiva",
      warning_message:
        "Tutti i dati verranno trasferiti al secondo contatto. Questa azione non pu\u00f2 essere annullata.",
      merge_contacts: "Unisci Contatti",
      merging: "Unione in corso...",
      select_contact_warning: "Seleziona un contatto con cui unire",
      merge_success: "Contatti uniti con successo",
      merge_error: "Impossibile unire i contatti",
      import_csv: "Importa CSV",
      import_title: "Importa",
      import_running:
        "L'importazione \u00e8 in corso, non chiudere questa scheda.",
      import_progress:
        "Importati %{imported} / %{total} contatti, con %{errors} errori.",
      import_remaining: "Tempo rimanente stimato:",
      import_stop: "Ferma importazione",
      import_error:
        "Impossibile importare questo file, assicurati di aver fornito un file CSV valido.",
      import_complete:
        "Importazione contatti completata. Importati %{imported} contatti, con %{errors} errori",
      import_sample: "Ecco un file CSV di esempio da usare come modello",
      import_download_sample: "Scarica CSV di esempio",
      csv_file: "File CSV",
      export_vcard: "Esporta in vCard",
    },
    companies: {
      create: "Crea Azienda",
    },
    deals: {
      updated: "Trattativa aggiornata",
      edit_deal: "Modifica trattativa %{name}",
      back_to_deal: "Torna alla trattativa",
      view_archived: "Visualizza trattative archiviate",
      archived_title: "Trattative Archiviate",
    },
    tasks: {
      description: "Descrizione",
      contact: "Contatto",
      edit_title: "Modifica attivit\u00e0",
      updated: "Attivit\u00e0 aggiornata",
      deleted: "Attivit\u00e0 eliminata",
      load_more: "Carica altro",
    },
    import: {
      title: "Importa Dati",
      description:
        "Puoi importare venditori, aziende, contatti, note e attivit\u00e0.",
      json_format:
        "I dati devono essere in un file JSON corrispondente al seguente esempio:",
      sample_file: "esempio.json",
      unable_to_import: "Impossibile importare questo file.",
      in_progress:
        "Importazione in corso, non navigare lontano da questa pagina.",
      complete: "Importazione completata.",
      some_failed: "Alcuni record non sono stati importati.",
      all_success: "Tutti i record sono stati importati con successo.",
      download_error_report: "Scarica il report degli errori",
      import_another: "Importa un altro file",
      imported: "Importati",
      failed: "Falliti",
      entity_sales: "venditori",
      entity_companies: "aziende",
      entity_contacts: "contatti",
      entity_notes: "note",
      entity_tasks: "attivit\u00e0",
    },
    misc: {
      create: "Crea",
      close: "Chiudi",
      contact: "Contatto",
      note: "Nota",
      task: "Attivit\u00e0",
    },
    settings: {
      title: "Impostazioni",
      branding: "Branding",
      app_title: "Titolo App",
      light_mode_logo: "Logo Tema Chiaro",
      dark_mode_logo: "Logo Tema Scuro",
      companies: "Aziende",
      sectors: "Settori",
      deals: "Trattative",
      stages: "Fasi",
      pipeline_statuses: "Stati Pipeline",
      pipeline_description:
        'Seleziona quali fasi delle trattative contano come trattative "pipeline" (completate).',
      categories: "Categorie",
      notes: "Note",
      statuses: "Stati",
      tasks: "Attivit\u00e0",
      types: "Tipi",
      authentication: "Autenticazione",
      ldap_title: "LDAP / Active Directory",
      ldap_description: "Abilita l'autenticazione LDAP per Active Directory o Azure AD DS.",
      reset_to_defaults: "Ripristina predefiniti",
      cancel: "Annulla",
      save: "Salva",
      saving: "Salvataggio...",
      saved: "Configurazione salvata con successo",
      save_error: "Impossibile salvare la configurazione",
    },
  },
  "ra-supabase": {
    auth: {
      email: "Email",
      confirm_password: "Conferma password",
      sign_in_with: "Accedi con %{provider}",
      forgot_password: "Password dimenticata?",
      reset_password: "Reimposta password",
      password_reset:
        "Controlla la tua email per il messaggio di reimpostazione password.",
      missing_tokens: "Token di accesso e aggiornamento mancanti",
      back_to_login: "Torna al login",
    },
    reset_password: {
      forgot_password: "Password dimenticata?",
      forgot_password_details:
        "Inserisci la tua email per le istruzioni.",
    },
    set_password: {
      new_password: "Scegli la tua password",
    },
    validation: {
      password_mismatch: "Le password non corrispondono",
    },
  },
};
