#!/usr/bin/env python3
"""
Undo the renaming of Fable cards back to original names
"""

import os
from pathlib import Path

# Mapping from the rename output (new -> old)
rename_mappings = [
    ("009-001.jpg", "jasmine_-_fearless_princess.jpg"),
    ("009-002.jpg", "scar_-_finally_king.jpg"),
    ("009-003.jpg", "lilo_-_best_explorer_ever.jpg"),
    ("009-004.jpg", "one_last_hope.jpg"),
    ("009-005.jpg", "mickey_mouse_-_standard_bearer.jpg"),
    ("009-006.jpg", "robin_hood_-_capable_fighter.jpg"),
    ("009-007.jpg", "mauis_place_of_exile_-_hidden_island.jpg"),
    ("009-008.jpg", "beast�s_mirror.jpg"),
    ("009-009.jpg", "the_mob_song.jpg"),
    ("009-010.jpg", "strength_of_a_raging_fire.jpg"),
    ("009-011.jpg", "fire_the_cannons.jpg"),
    ("009-012.jpg", "i_find_�em_i_flatten_�em.jpg"),
    ("009-013.jpg", "smash.jpg"),
    ("009-014.jpg", "ariel_-_determined_mermaid.jpg"),
    ("009-015.jpg", "ariel_-_sonic_warrior.jpg"),
    ("009-016.jpg", "prince_eric_-_dashing_and_brave.jpg"),
    ("009-017.jpg", "li_shang_-_imperial_captain.jpg"),
    ("009-018.jpg", "john_silver_-_greedy_treasure_seeker.jpg"),
    ("009-019.jpg", "hercules_-_true_hero.jpg"),
    ("009-020.jpg", "captain_hook_-_captain_of_the_jolly_roger.jpg"),
    ("009-021.jpg", "tinker_bell_-_tiny_tactician.jpg"),
    ("009-022.jpg", "tinker_bell_-_giant_fairy.jpg"),
    ("009-023.jpg", "lawrence_-_jealous_manservant.jpg"),
    ("009-024.jpg", "hercules_-_beloved_hero.jpg"),
    ("009-025.jpg", "eeyore_-_overstuffed_donkey.jpg"),
    ("009-026.jpg", "prince_naveen_-_penniless_royal.jpg"),
    ("009-027.jpg", "jafar_-_royal_vizier.jpg"),
    ("009-028.jpg", "benja_-_guardian_of_the_dragon_gem.jpg"),
    ("009-029.jpg", "tiana_-_diligent_waitress.jpg"),
    ("009-030.jpg", "robin_hood_-_champion_of_sherwood.jpg"),
    ("009-031.jpg", "little_john_-_sir_reginald.jpg"),
    ("009-032.jpg", "nala_-_undaunted_lioness.jpg"),
    ("009-033.jpg", "mickey_mouse_-_trumpeter.jpg"),
    ("009-034.jpg", "philoctetes_-_no-nonsense_instructor.jpg"),
    ("009-035.jpg", "hades_-_infernal_schemer.jpg"),
    ("009-036.jpg", "cruella_de_vil_-_style_icon.jpg"),
    ("009-037.jpg", "mulan_-_considerate_diplomat.jpg"),
    ("009-038.jpg", "the_queen_-_mirror_seeker.jpg"),
    ("009-039.jpg", "anna_-_braving_the_storm.jpg"),
    ("009-040.jpg", "alice_-_accidentally_adrift.jpg"),
    ("009-041.jpg", "motunui_-_island_paradise.jpg"),
    ("009-042.jpg", "coconut_basket.jpg"),
    ("009-043.jpg", "heart_of_te_fiti.jpg"),
    ("009-044.jpg", "aurelian_gyrosensor.jpg"),
    ("009-045.jpg", "dig_a_little_deeper.jpg"),
    ("009-046.jpg", "one_jump_ahead.jpg"),
    ("009-047.jpg", "four_dozen_eggs.jpg"),
    ("009-048.jpg", "develop_your_brain.jpg"),
    ("009-049.jpg", "robin_hood_-_unrivaled_archer.jpg"),
    ("009-050.jpg", "aurora_-_regal_princess.jpg"),
    ("009-051.jpg", "alice_-_growing_girl.jpg"),
    ("009-052.jpg", "winnie_the_pooh_-_having_a_think.jpg"),
    ("009-053.jpg", "maid_marian_-_delightful_dreamer.jpg"),
    ("009-054.jpg", "judy_hopps_-_optimistic_officer.jpg"),
    ("009-055.jpg", "belle_-_inventive_engineer.jpg"),
    ("009-056.jpg", "jasmine_-_heir_of_agrabah.jpg"),
    ("009-057.jpg", "aurora_-_tranquil_princess.jpg"),
    ("009-058.jpg", "aurora_-_dreaming_guardian.jpg"),
    ("009-059.jpg", "mama_odie_-_mystical_maven.jpg"),
    ("009-060.jpg", "grand_pabbie_-_oldest_and_wisest.jpg"),
    ("009-061.jpg", "hans_-_noble_scoundrel.jpg"),
    ("009-062.jpg", "flounder_-_voice_of_reason.jpg"),
    ("009-063.jpg", "cruella_de_vil_-_fashionable_cruiser.jpg"),
    ("009-064.jpg", "mufasa_-_king_of_the_pride_lands.jpg"),
    ("009-065.jpg", "louie_-_chill_nephew.jpg"),
    ("009-066.jpg", "dewey_-_showy_nephew.jpg"),
    ("009-067.jpg", "huey_-_savvy_nephew.jpg"),
    ("009-068.jpg", "anna_-_true-hearted.jpg"),
    ("009-069.jpg", "mickey_mouse_-_brave_little_prince.jpg"),
    ("009-070.jpg", "i2i.jpg"),
    ("009-071.jpg", "powerline_-_worlds_greatest_rock_star.jpg"),
    ("009-072.jpg", "ariel_-_adventurous_collector.jpg"),
    ("009-073.jpg", "be_king_undisputed.jpg"),
    ("009-074.jpg", "powerline_-_musical_superstar.jpg"),
    ("009-075.jpg", "max_goof_-_rockin_teen.jpg"),
    ("009-076.jpg", "agrabah_-_marketplace.jpg"),
    ("009-077.jpg", "dinner_bell.jpg"),
    ("009-078.jpg", "medallion_weights.jpg"),
    ("009-079.jpg", "a_pirate�s_life.jpg"),
    ("009-080.jpg", "you_can_fly.jpg"),
    ("009-081.jpg", "tuk_tuk_-_lively_partner.jpg"),
    ("009-082.jpg", "sergeant_tibbs_-_courageous_cat.jpg"),
    ("009-083.jpg", "raya_-_headstrong.jpg"),
    ("009-084.jpg", "mulan_-_elite_archer.jpg"),
    ("009-085.jpg", "mulan_-_injured_soldier.jpg"),
    ("009-086.jpg", "rapunzel_-_letting_down_her_hair.jpg"),
    ("009-087.jpg", "queen_of_hearts_-_impulsive_ruler.jpg"),
    ("009-088.jpg", "card_soldiers_-_full_deck.jpg"),
    ("009-089.jpg", "lumiere_-_fiery_friend.jpg"),
    ("009-090.jpg", "queen_of_hearts_-_sensing_weakness.jpg"),
    ("009-091.jpg", "sisu_-_daring_visitor.jpg"),
    ("009-092.jpg", "sisu_-_emboldened_warrior.jpg"),
    ("009-093.jpg", "moana_-_undeterred_voyager.jpg"),
    ("009-094.jpg", "gaston_-_arrogant_hunter.jpg"),
    ("009-095.jpg", "pj_pete_-_caught_up_in_the_music.jpg"),
    ("009-096.jpg", "roxanne_-_powerline_fan.jpg"),
    ("009-097.jpg", "powerline_-_taking_the_stage.jpg"),
    ("009-098.jpg", "maleficent_-_monstrous_dragon.jpg"),
    ("009-099.jpg", "maui_-_whale.jpg"),
    ("009-100.jpg", "simba_-_scrappy_cub.jpg"),
    ("009-101.jpg", "shere_khan_-_menacing_predator.jpg"),
    ("009-102.jpg", "lefou_-_instigator.jpg"),
    ("009-103.jpg", "mickey_mouse_-_steamboat_pilot.jpg"),
    ("009-104.jpg", "max_goof_-_chart_topper.jpg"),
    ("009-105.jpg", "genie_-_of_the_lamp.jpg"),
    ("009-106.jpg", "stand_out.jpg"),
    ("009-107.jpg", "pegasus_-_gift_for_hercules.jpg"),
    ("009-108.jpg", "goofy_-_set_for_adventure.jpg"),
    ("009-109.jpg", "hidden_cove_-_tranquil_haven.jpg"),
    ("009-110.jpg", "signed_contract.jpg"),
    ("009-111.jpg", "family_fishing_pole.jpg"),
    ("009-112.jpg", "mother_knows_best.jpg"),
    ("009-113.jpg", "make_the_potion.jpg"),
    ("009-114.jpg", "under_the_sea.jpg"),
    ("009-115.jpg", "improvise.jpg"),
    ("009-116.jpg", "sudden_chill.jpg"),
    ("009-117.jpg", "daisy_duck_-_secret_agent.jpg"),
    ("009-118.jpg", "aladdin_-_prince_ali.jpg"),
    ("009-119.jpg", "wildcat_-_mechanic.jpg"),
    ("009-120.jpg", "ursula_-_deceiver.jpg"),
    ("009-121.jpg", "john_silver_-_alien_pirate.jpg"),
    ("009-122.jpg", "tinker_bell_-_most_helpful.jpg"),
    ("009-123.jpg", "shenzi_-_hyena_pack_leader.jpg"),
    ("009-124.jpg", "heihei_-_bumbling_rooster.jpg"),
    ("009-125.jpg", "donald_duck_-_perfect_gentleman.jpg"),
    ("009-126.jpg", "donald_duck_-_sleepwalker.jpg"),
    ("009-127.jpg", "virana_-_fang_chief.jpg"),
    ("009-128.jpg", "enchantress_-_unexpected_judge.jpg"),
    ("009-129.jpg", "megara_-_pulling_the_strings.jpg"),
    ("009-130.jpg", "bobby_zimuruski_-_spray_cheese_kid.jpg"),
    ("009-131.jpg", "max_goof_-_rebellious_teen.jpg"),
    ("009-132.jpg", "prince_phillip_-_vanquisher_of_foes.jpg"),
    ("009-133.jpg", "prince_phillip_-_warden_of_the_woods.jpg"),
    ("009-134.jpg", "cursed_merfolk_-_ursulas_handiwork.jpg"),
    ("009-135.jpg", "robin_hood_-_daydreamer.jpg"),
    ("009-136.jpg", "kuzco_-_temperamental_emperor.jpg"),
    ("009-137.jpg", "dumbo_-_ninth_wonder_of_the_universe.jpg"),
    ("009-138.jpg", "winnie_the_pooh_-_hunny_wizard.jpg"),
    ("009-139.jpg", "belle_-_accomplished_mystic.jpg"),
    ("009-140.jpg", "elsa_-_snow_queen.jpg"),
    ("009-141.jpg", "kuzco_-_wanted_llama.jpg"),
    ("009-142.jpg", "ursula_-_sea_witch.jpg"),
    ("009-143.jpg", "casa_madrigal_-_casita.jpg"),
    ("009-144.jpg", "rose_lantern.jpg"),
    ("009-145.jpg", "white_rabbit�s_pocket_watch.jpg"),
    ("009-146.jpg", "magic_mirror.jpg"),
    ("009-147.jpg", "the_magic_feather.jpg"),
    ("009-148.jpg", "im_stuck.jpg"),
    ("009-149.jpg", "last-ditch_effort.jpg"),
    ("009-150.jpg", "poor_unfortunate_souls.jpg"),
    ("009-151.jpg", "second_star_to_the_right.jpg"),
    ("009-152.jpg", "jafar_-_lamp_thief.jpg"),
    ("009-153.jpg", "luisa_madrigal_-_magically_strong_one.jpg"),
    ("009-154.jpg", "mama_odie_-_voice_of_wisdom.jpg"),
    ("009-155.jpg", "sven_-_official_ice_deliverer.jpg"),
    ("009-156.jpg", "olaf_-_friendly_snowman.jpg"),
    ("009-157.jpg", "genie_-_supportive_friend.jpg"),
    ("009-158.jpg", "camilo_madrigal_-_prankster.jpg"),
    ("009-159.jpg", "dolores_madrigal_-_easy_listener.jpg"),
    ("009-160.jpg", "tick-tock_-_ever-present_pursuer.jpg"),
    ("009-161.jpg", "elsa_-_gloves_off.jpg"),
    ("009-162.jpg", "timothy_q_mouse_-_flight_instructor.jpg"),
    ("009-163.jpg", "dumbo_-_the_flying_elephant.jpg"),
    ("009-164.jpg", "ursula_-_voice_stealer.jpg"),
    ("009-165.jpg", "elsa_-_spirit_of_winter.jpg"),
    ("009-166.jpg", "peter_pans_shadow_-_not_sewn_on.jpg"),
    ("009-167.jpg", "belle_-_untrained_mystic.jpg"),
    ("009-168.jpg", "jafar_-_keeper_of_secrets.jpg"),
    ("009-169.jpg", "rafiki_-_mystical_fighter.jpg"),
    ("009-170.jpg", "the_queen_-_wicked_and_vain.jpg"),
    ("009-171.jpg", "minnie_mouse_-_sweetheart_princess.jpg"),
    ("009-172.jpg", "circle_of_life.jpg"),
    ("009-173.jpg", "beast_-_gracious_prince.jpg"),
    ("009-174.jpg", "pongo_-_determined_father.jpg"),
    ("009-175.jpg", "stitch_-_alien_dancer.jpg"),
    ("009-176.jpg", "aurora_-_holding_court.jpg"),
    ("009-177.jpg", "the_queen_-_conceited_ruler.jpg"),
    ("009-178.jpg", "atlantica_-_concert_hall.jpg"),
    ("009-179.jpg", "ursula�s_shell_necklace.jpg"),
    ("009-180.jpg", "lantern.jpg"),
    ("009-181.jpg", "be_our_guest.jpg"),
    ("009-182.jpg", "worlds_greatest_criminal_mind.jpg"),
    ("009-183.jpg", "brunos_return.jpg"),
    ("009-184.jpg", "lost_in_the_woods.jpg"),
    ("009-185.jpg", "heal_what_has_been_hurt.jpg"),
    ("009-186.jpg", "look_at_this_family.jpg"),
    ("009-187.jpg", "stitch_-_carefree_surfer.jpg"),
    ("009-188.jpg", "queen_of_hearts_-_wonderland_empress.jpg"),
    ("009-189.jpg", "ursula_-_vanessa.jpg"),
    ("009-190.jpg", "pluto_-_friendly_pooch.jpg"),
    ("009-191.jpg", "moana_-_of_motunui.jpg"),
    ("009-192.jpg", "cinderella_-_gentle_and_kind.jpg"),
    ("009-193.jpg", "julieta_madrigal_-_excellent_cook.jpg"),
    ("009-194.jpg", "nani_-_protective_sister.jpg"),
    ("009-195.jpg", "pluto_-_rescue_dog.jpg"),
    ("009-196.jpg", "ariel_-_singing_mermaid.jpg"),
    ("009-197.jpg", "pluto_-_determined_defender.jpg"),
    ("009-198.jpg", "mickey_mouse_-_true_friend.jpg"),
    ("009-199.jpg", "tinker_bell_-_generous_fairy.jpg"),
    ("009-200.jpg", "daisy_duck_-_musketeer_spy.jpg"),
    ("009-201.jpg", "mulan_-_free_spirit.jpg"),
    ("009-202.jpg", "rapunzel_-_sunshine.jpg"),
    ("009-203.jpg", "the_queen_-_regal_monarch.jpg"),
    ("009-204.jpg", "stitch_-_rock_star.jpg")
]

def undo_rename():
    """Undo the rename operation"""
    image_dir = Path("../tools/lorcana-mulligan/card-images")
    
    success_count = 0
    failed_count = 0
    
    for new_name, old_name in rename_mappings:
        new_path = image_dir / new_name
        old_path = image_dir / old_name
        
        if new_path.exists():
            try:
                if not old_path.exists():
                    new_path.rename(old_path)
                    print(f"Restored: {new_name} -> {old_name}")
                    success_count += 1
                else:
                    print(f"Skipped: {old_name} already exists")
                    failed_count += 1
            except Exception as e:
                print(f"Error restoring {new_name}: {e}")
                failed_count += 1
        else:
            print(f"Not found: {new_name}")
            failed_count += 1
    
    print(f"\nUndo complete!")
    print(f"Successfully restored: {success_count} files")
    print(f"Failed/Skipped: {failed_count} files")

def main():
    print("Undoing Fable card renaming...")
    undo_rename()

if __name__ == "__main__":
    main()