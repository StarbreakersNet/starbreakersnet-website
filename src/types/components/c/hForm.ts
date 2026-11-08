import type { FormInst, FormValidationError } from "naive-ui";
import type { Ref } from "vue";

export interface HFormInst extends FormInst {
    /** Indique si le formulaire est valide (sans déclencher la validation UI) */
    isValid: Ref<boolean>;

    /** Indique si le formulaire a des modifications par rapport aux valeurs initiales */
    hasChanges: Ref<boolean>;

    /**
     * Valide un champ spécifique du formulaire
     * @param path - Le chemin du champ à valider
     * @param callback - Callback appelé après la validation
     */
    validateField: (
        path: string,
        callback?: (errors?: Array<FormValidationError>) => void,
    ) => Promise<void> | undefined;

    /**
     * Remet le formulaire à ses valeurs initiales et restaure la validation
     */
    reset: () => void;

    /** Référence vers le FormInst natif de Naive UI */
    naiveFormRef: Ref<FormInst | undefined>;
}
