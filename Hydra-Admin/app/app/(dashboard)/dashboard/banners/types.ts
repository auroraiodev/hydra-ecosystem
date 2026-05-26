export interface Tcg {
  id: string;
  name: string;
  display_name: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  desktop_image: string;
  mobile_image?: string;
  button_text?: string;
  button_link?: string;
  is_active: boolean;
  order: number;
  tcg_id?: string;
  tcgs?: Tcg;
}

export interface FormState {
  title: string;
  subtitle: string;
  description: string;
  desktop_image: string;
  mobile_image: string;
  button_text: string;
  button_link: string;
  is_active: boolean;
  order: number;
  tcg_id: string;
}

export const emptyForm = (): FormState => ({
  title: '',
  subtitle: '',
  description: '',
  desktop_image: '',
  mobile_image: '',
  button_text: '',
  button_link: '',
  is_active: true,
  order: 0,
  tcg_id: 'none',
});
